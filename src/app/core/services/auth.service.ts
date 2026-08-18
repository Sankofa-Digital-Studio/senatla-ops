import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppRole, AuthSession } from '../models/app.models';
import { AUTH_GATEWAY, AuthGateway, RegistrationRequest } from '../gateways/auth.gateway';
import { sessionHasExpired } from '../auth/session-policy';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authGateway = inject<AuthGateway>(AUTH_GATEWAY);
  private readonly router = inject(Router);
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly readyState = signal(false);
  private restorePromise: Promise<void> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly session = computed(() => this.currentSession());
  readonly isReady = this.readyState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentSession());
  readonly role = computed<AppRole | null>(() => this.currentSession()?.role ?? null);
  readonly displayName = computed(() => this.currentSession()?.displayName ?? 'Guest');

  constructor() {
    this.authGateway.subscribeToSession?.((session) => {
      this.setSession(session);
      this.readyState.set(true);
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void this.expireIfNeeded();
      });
    }
    void this.ensureReady();
  }

  async ensureReady() {
    if (this.readyState()) return;
    if (!this.restorePromise) this.restorePromise = this.restoreSession();
    await this.restorePromise;
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    await this.ensureReady();
    const session = await this.authGateway.login(username, password);
    this.setSession(session);
    this.readyState.set(true);
    return session;
  }

  async register(request: RegistrationRequest) {
    return await this.authGateway.register(request);
  }

  async redeemAdminCode(code: string) {
    return await this.authGateway.redeemAdminCode(code);
  }

  async logout() {
    this.setSession(null);
    await this.authGateway.logout();
  }

  canAccess(role?: AppRole) {
    const session = this.currentSession();
    return !!session && (!role || session.role === role);
  }

  validateSession() {
    const session = this.sessionState();
    if (!session) return false;
    if (!sessionHasExpired(session)) return true;
    void this.expireIfNeeded();
    return false;
  }

  currentSession() {
    return this.validateSession() ? this.sessionState() : null;
  }

  private setSession(session: AuthSession | null) {
    this.clearExpiryTimer();
    this.sessionState.set(session);
    if (!session) return;

    const delay = new Date(session.expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      void this.expireIfNeeded();
      return;
    }
    this.expiryTimer = setTimeout(() => void this.expireIfNeeded(), delay);
  }

  private clearExpiryTimer() {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
  }

  private async expireIfNeeded() {
    const session = this.sessionState();
    if (!session || !sessionHasExpired(session)) return;
    const currentUrl = this.router.url;
    await this.logout();
    if (!this.isPublicRoute(currentUrl)) {
      await this.router.navigate(['/login'], { queryParams: { redirect: currentUrl } });
    }
  }

  private isPublicRoute(url: string) {
    const path = url.split('?')[0];
    return path === '/landing' || path === '/login' || path.startsWith('/login/') || path === '/register';
  }

  private async restoreSession() {
    try {
      this.setSession(await this.authGateway.loadSession());
    } catch {
      this.setSession(null);
    } finally {
      this.readyState.set(true);
      this.restorePromise = null;
    }
  }
}