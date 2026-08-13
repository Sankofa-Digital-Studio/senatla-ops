import { Injectable } from '@angular/core';
import { AppRole, AuthSession } from '../models/app.models';
import { AuthGateway } from './auth.gateway';

type ReviewAccount = {
  password: string;
  role: AppRole;
  displayName: string;
  permittedSiteIds: string[];
};

const SESSION_KEY = 'senatla_ops_local_review_session_v1';

@Injectable()
export class LocalReviewAuthGateway implements AuthGateway {
  private readonly listeners = new Set<(session: AuthSession | null) => void>();
  private readonly credentials = new Map<string, ReviewAccount>([
    ['site.manager@test.invalid', { password: 'test-password', role: 'site', displayName: 'Site Manager', permittedSiteIds: ['demo-workshop'] }],
    ['office.admin@test.invalid', { password: 'test-password', role: 'office', displayName: 'Office Admin', permittedSiteIds: [] }],
    ['director.exec@test.invalid', { password: 'test-password', role: 'director', displayName: 'Director', permittedSiteIds: [] }],
  ]);

  async loadSession(): Promise<AuthSession | null> {
    return this.readSession();
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const email = username.trim().toLowerCase();
    const account = this.credentials.get(email);
    if (!account || account.password !== password.trim()) return null;

    const session: AuthSession = {
      userId: `${account.role}-review-user`,
      username: email,
      role: account.role,
      displayName: account.displayName,
      organizationId: '00000000-0000-4000-8000-000000000001',
      permittedSiteIds: account.permittedSiteIds,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.emit(session);
    return session;
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(SESSION_KEY);
    this.emit(null);
  }

  subscribeToSession(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private readSession() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as AuthSession | null;
      if (!parsed?.expiresAt || new Date(parsed.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private emit(session: AuthSession | null) {
    for (const listener of this.listeners) listener(session);
  }
}