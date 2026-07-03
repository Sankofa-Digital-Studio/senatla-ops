import { Injectable } from '@angular/core';
import { AuthGateway } from './auth.gateway';
import { AppRole, AuthSession, DemoUser } from '../models/app.models';

const SESSION_KEY = 'senatla_ops_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

const DEMO_USERS: DemoUser[] = [
  { username: 'site.manager', password: 'SenatlaDemo!', role: 'site', displayName: 'Site Manager' },
  { username: 'office.admin', password: 'SenatlaDemo!', role: 'office', displayName: 'Office Admin' },
  { username: 'director.exec', password: 'SenatlaDemo!', role: 'director', displayName: 'Director' },
];

@Injectable()
export class LocalDemoAuthGateway implements AuthGateway {
  private readonly listeners = new Set<(session: AuthSession | null) => void>();

  async loadSession(): Promise<AuthSession | null> {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (this.isSessionExpired(parsed)) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return this.buildSession(parsed.username, parsed.role, parsed.displayName, parsed.issuedAt, parsed.expiresAt);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const normalizedUser = username.trim().toLowerCase();
    const user = DEMO_USERS.find(
      (entry) => entry.username === normalizedUser && entry.password === password.trim(),
    );

    if (!user) return null;

    const session = this.buildSession(user.username, user.role, user.displayName);
    if (!session) return null;

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.emit(session);
    return session;
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(SESSION_KEY);
    this.emit(null);
  }

  demoUsers(): DemoUser[] {
    return DEMO_USERS;
  }

  subscribeToSession(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private buildSession(
    username?: string,
    role?: AppRole | null,
    displayName?: string,
    issuedAt?: string,
    expiresAt?: string,
  ): AuthSession | null {
    const validUser = DEMO_USERS.find(
      (entry) => entry.username === username && entry.role === role && entry.displayName === displayName,
    );
    if (!validUser) return null;

    const now = new Date();
    const issued = issuedAt && !Number.isNaN(Date.parse(issuedAt)) ? issuedAt : now.toISOString();
    const expires =
      expiresAt && !Number.isNaN(Date.parse(expiresAt))
        ? expiresAt
        : new Date(now.getTime() + SESSION_DURATION_MS).toISOString();

    return {
      userId: `demo-${validUser.role}`,
      username: validUser.username,
      role: validUser.role,
      displayName: validUser.displayName,
      issuedAt: issued,
      expiresAt: expires,
    };
  }

  private isSessionExpired(session: Partial<AuthSession> | null | undefined) {
    if (!session?.expiresAt) return true;
    const expiresAt = new Date(session.expiresAt).getTime();
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
  }

  private emit(session: AuthSession | null) {
    for (const listener of this.listeners) {
      listener(session);
    }
  }
}
