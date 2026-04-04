import { Injectable, computed, inject, signal } from '@angular/core';
import { AppRole, AuthSession } from '../models/app.models';
import { AUTH_GATEWAY, AuthGateway } from '../gateways/auth.gateway';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authGateway = inject<AuthGateway>(AUTH_GATEWAY);
  private sessionState = signal<AuthSession | null>(this.authGateway.loadSession());

  readonly session = computed(() => this.currentSession());
  readonly isAuthenticated = computed(() => !!this.currentSession());
  readonly role = computed<AppRole | null>(() => this.currentSession()?.role ?? null);
  readonly displayName = computed(() => this.currentSession()?.displayName ?? 'Guest');

  async login(username: string, password: string): Promise<AuthSession | null> {
    const session = await this.authGateway.login(username, password);
    this.sessionState.set(session);
    return session;
  }

  async logout() {
    this.sessionState.set(null);
    await this.authGateway.logout();
  }

  canAccess(role?: AppRole) {
    if (!this.validateSession()) {
      return false;
    }

    const session = this.sessionState();
    if (!session) {
      return false;
    }

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

  demoUsers() {
    return this.authGateway.demoUsers();
  }
}
