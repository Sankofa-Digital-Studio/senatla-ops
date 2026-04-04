import { Injectable, computed, inject, signal } from '@angular/core';
import { AppRole, AuthSession, DemoUser } from '../models/app.models';
import { AUTH_GATEWAY, AuthGateway } from '../gateways/auth.gateway';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authGateway = inject<AuthGateway>(AUTH_GATEWAY);
  private sessionState = signal<AuthSession | null>(this.authGateway.loadSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly role = computed<AppRole | null>(() => this.sessionState()?.role ?? null);
  readonly displayName = computed(() => this.sessionState()?.displayName ?? 'Guest');

  async login(username: string, password: string): Promise<AuthSession | null> {
    const session = await this.authGateway.login(username, password);
    this.sessionState.set(session);
    return session;
  }

  async logout() {
    await this.authGateway.logout();
    this.sessionState.set(null);
  }

  canAccess(role: AppRole) {
    if (!this.sessionState()) {
      return false;
    }
    return this.role() === role;
  }

  demoUsers() {
    return this.authGateway.demoUsers();
  }
}
