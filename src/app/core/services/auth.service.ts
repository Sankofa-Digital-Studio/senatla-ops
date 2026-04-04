import { Injectable, computed, signal } from '@angular/core';
import { AppRole, AuthSession, DemoUser } from '../models/app.models';

const SESSION_KEY = 'senatla_ops_session';

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

    const session: AuthSession = {
      username: user.username,
      role: user.role,
      displayName: user.displayName,
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
      const validUser = DEMO_USERS.find(
        (entry) =>
          entry.username === parsed.username &&
          entry.role === parsed.role &&
          entry.displayName === parsed.displayName,
      );
      return validUser ?? null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
