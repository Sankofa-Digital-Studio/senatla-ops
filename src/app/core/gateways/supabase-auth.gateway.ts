import { Injectable, inject } from '@angular/core';
import { AuthGateway } from './auth.gateway';
import { AppRole, AuthSession, DemoUser } from '../models/app.models';
import { injectSupabaseClient } from './supabase.client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { RUNTIME_CONFIG, RuntimeConfig } from '../config/runtime-config';

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: AppRole | null;
};

const REVIEW_BYPASS_STORAGE_KEY = 'senatla.review-bypass-session';

@Injectable()
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = injectSupabaseClient();
  private readonly config = inject<RuntimeConfig>(RUNTIME_CONFIG);
  private authSubscriptionStarted = false;
  private readonly listeners = new Set<(session: AuthSession | null) => void>();

  async loadSession(): Promise<AuthSession | null> {
    const reviewSession = this.loadReviewBypassSession();
    if (reviewSession) return reviewSession;

    const { data, error } = await this.supabase.auth.getSession();
    if (error || !data.session) return null;
    return await this.buildSession(data.session.user.id, data.session.user.email ?? '');
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const email = username.trim().toLowerCase();
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: password.trim(),
    });

    if (error || !data.user) {
      return await this.tryReviewBypass(email);
    }

    return await this.buildSession(data.user.id, data.user.email ?? email);
  }

  async logout(): Promise<void> {
    this.clearReviewBypassSession();
    await this.supabase.auth.signOut();
  }

  demoUsers(): DemoUser[] {
    return [];
  }

  subscribeToSession(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    this.ensureAuthSubscription();
    return () => this.listeners.delete(listener);
  }

  private async buildSession(userId: string, fallbackEmail: string): Promise<AuthSession | null> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('id, username, display_name, role')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    if (error || !profile?.role) {
      await this.logout();
      return null;
    }

    const { data: sessionData } = await this.supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return null;

    return {
      userId,
      username: profile.username || fallbackEmail || userId,
      role: profile.role,
      displayName: profile.display_name || fallbackEmail || 'Unknown User',
      issuedAt: session.user.created_at || new Date().toISOString(),
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    };
  }

  private async tryReviewBypass(email: string): Promise<AuthSession | null> {
    if (!this.config.auth.reviewBypassEnabled) {
      return null;
    }

    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('id, username, display_name, role, is_active')
      .eq('username', email)
      .maybeSingle<ProfileRow & { is_active?: boolean | null }>();

    if (error || !profile?.role || profile.is_active === false) {
      return null;
    }

    const now = new Date();
    const session: AuthSession = {
      userId: profile.id,
      username: profile.username || email,
      role: profile.role,
      displayName: profile.display_name || email,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 8).toISOString(),
    };

    this.saveReviewBypassSession(session);
    return session;
  }

  private ensureAuthSubscription() {
    if (this.authSubscriptionStarted) return;

    this.authSubscriptionStarted = true;
    this.supabase.auth.onAuthStateChange((event, session) => {
      void this.handleAuthStateChange(event, session);
    });
  }

  private async handleAuthStateChange(_event: AuthChangeEvent, session: Session | null) {
    if (!session?.user) {
      this.emit(null);
      return;
    }

    const authSession = await this.buildSession(session.user.id, session.user.email ?? '');
    this.emit(authSession);
  }

  private emit(session: AuthSession | null) {
    for (const listener of this.listeners) {
      listener(session);
    }
  }

  private loadReviewBypassSession(): AuthSession | null {
    if (!this.config.auth.reviewBypassEnabled || typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(REVIEW_BYPASS_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AuthSession;
      const expiresAt = new Date(parsed.expiresAt).getTime();
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clearReviewBypassSession();
        return null;
      }

      return parsed;
    } catch {
      this.clearReviewBypassSession();
      return null;
    }
  }

  private saveReviewBypassSession(session: AuthSession) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(REVIEW_BYPASS_STORAGE_KEY, JSON.stringify(session));
  }

  private clearReviewBypassSession() {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(REVIEW_BYPASS_STORAGE_KEY);
  }
}
