import { Injectable } from '@angular/core';
import { AppRole, AuthSession } from '../models/app.models';
import { cappedSessionExpiry, sessionHasExpired } from '../auth/session-policy';
import { AuthGateway, PasswordResetRequestResult, RegistrationRequest, RegistrationResult } from './auth.gateway';

type ReviewAccount = {
  password: string;
  role: AppRole;
  displayName: string;
  permittedSiteIds: string[];
};

const SESSION_KEY = 'senatla_ops_local_review_session_v1';
const MOCK_RESET_KEY = 'senatla_ops_local_review_reset_v1';
const LOCAL_REVIEW_RECOVERY_PATH = '/login/recovery';

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

    const issuedAt = new Date().toISOString();
    const session: AuthSession = {
      userId: `${account.role}-review-user`,
      username: email,
      role: account.role,
      displayName: account.displayName,
      organizationId: '00000000-0000-4000-8000-000000000001',
      permittedSiteIds: account.permittedSiteIds,
      issuedAt,
      expiresAt: cappedSessionExpiry(issuedAt),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.emit(session);
    return session;
  }

  async register(_request: RegistrationRequest): Promise<RegistrationResult> {
    return { success: false, confirmationRequired: false, adminGranted: false, message: 'Account registration is unavailable in local review mode.' };
  }

  async redeemAdminCode(_code: string): Promise<boolean> {
    return false;
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!this.credentials.has(normalizedEmail)) {
      throw new Error('No demo account matches that email.');
    }
    sessionStorage.setItem(MOCK_RESET_KEY, normalizedEmail);
    return {
      message: `Demo reset prepared for ${normalizedEmail}. Open the one-time recovery link to choose a new password.`,
      resetLink: `${location.origin}${LOCAL_REVIEW_RECOVERY_PATH}?mock_user=${encodeURIComponent(normalizedEmail)}`,
    };
  }

  async updatePassword(nextPassword: string, usernameHint?: string): Promise<void> {
    const password = nextPassword.trim();
    if (password.length < 8) {
      throw new Error('Choose a password with at least 8 characters.');
    }
    const email = (usernameHint || sessionStorage.getItem(MOCK_RESET_KEY) || '').trim().toLowerCase();
    const account = this.credentials.get(email);
    if (!account) {
      throw new Error('Demo recovery session is unavailable. Request a new reset link.');
    }
    this.credentials.set(email, { ...account, password });
    sessionStorage.removeItem(MOCK_RESET_KEY);
    this.emit(null);
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
      if (!parsed?.expiresAt || sessionHasExpired(parsed)) {
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
