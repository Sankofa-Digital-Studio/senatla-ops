import { Injectable, computed, signal } from '@angular/core';
import { AppRole, AuthSession, DemoUser } from '../models/app.models';

const SESSION_KEY = 'senatla_ops_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

const DEMO_USERS: DemoUser[] = [
  { username: 'site.manager', password: 'SenatlaDemo!', role: 'site', displayName: 'Site Manager' },
  { username: 'office.admin', password: 'SenatlaDemo!', role: 'office', displayName: 'Office Admin' },
  { username: 'director.exec', password: 'SenatlaDemo!', role: 'director', displayName: 'Director' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionState = signal<AuthSession | null>(this.loadSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly role = computed<AppRole | null>(() => this.sessionState()?.role ?? null);
  readonly displayName = computed(() => this.sessionState()?.displayName ?? 'Guest');

  login(username: string, password: string): DemoUser | null {
    const normalizedUser = username.trim().toLowerCase();
    const user = DEMO_USERS.find(
      (entry) => entry.username === normalizedUser && entry.password === password.trim(),
    );

    if (!user) {
      return null;
    }

    const now = new Date();
    const session: AuthSession = {
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.sessionState.set(session);
    return user;
  }

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    this.sessionState.set(null);
  }

  canAccess(role: AppRole) {
    if (this.isSessionExpired(this.sessionState())) {
      this.logout();
      return false;
    }
    return this.role() === role;
  }

  demoUsers() {
    return DEMO_USERS;
  }

  private loadSession(): AuthSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (this.isSessionExpired(parsed)) {
        this.logout();
        return null;
      }
      const validUser = DEMO_USERS.find(
        (entry) =>
          entry.username === parsed.username &&
          entry.role === parsed.role &&
          entry.displayName === parsed.displayName,
      );
      return validUser ? {
        username: validUser.username,
        role: validUser.role,
        displayName: validUser.displayName,
        issuedAt: parsed.issuedAt || new Date().toISOString(),
        expiresAt: parsed.expiresAt || new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      } : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private isSessionExpired(session: Partial<AuthSession> | null | undefined) {
    if (!session?.expiresAt) return true;
    const expiresAt = new Date(session.expiresAt).getTime();
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
  }
}
