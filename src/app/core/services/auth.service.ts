import { Injectable, computed, inject, signal } from '@angular/core';
import { AppRole, AuthSession } from '../models/app.models';
import { AUTH_GATEWAY, AuthGateway, RegistrationRequest } from '../gateways/auth.gateway';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authGateway = inject<AuthGateway>(AUTH_GATEWAY);
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly readyState = signal(false);
  private restorePromise: Promise<void> | null = null;

  readonly session = computed(() => this.currentSession());
  readonly isReady = this.readyState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentSession());
  readonly role = computed<AppRole | null>(() => this.currentSession()?.role ?? null);
  readonly displayName = computed(() => this.currentSession()?.displayName ?? 'Guest');

  constructor() {
    this.authGateway.subscribeToSession?.((session) => {
      this.sessionState.set(session);
      this.readyState.set(true);
    });
    void this.ensureReady();
  }

  async ensureReady() {
    if (this.readyState()) return;
    if (!this.restorePromise) {
      this.restorePromise = this.restoreSession();
    }
    await this.restorePromise;
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    await this.ensureReady();
    const session = await this.authGateway.login(username, password);
    this.sessionState.set(session);
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
    this.sessionState.set(null);
    await this.authGateway.logout();
  }

  canAccess(role?: AppRole) {
    const session = this.currentSession();
    if (!session) return false;
    return role ? session.role === role : true;
  }

  validateSession() {
    const session = this.sessionState();
    if (!session) return false;

    const expiresAt = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      this.sessionState.set(null);
      void this.authGateway.logout();
      return false;
    }

    return true;
  }

  currentSession() {
    return this.validateSession() ? this.sessionState() : null;
  }

  private async restoreSession() {
    try {
      const session = await this.authGateway.loadSession();
      this.sessionState.set(session);
    } catch {
      this.sessionState.set(null);
    } finally {
      this.readyState.set(true);
      this.restorePromise = null;
    }
  }
}
