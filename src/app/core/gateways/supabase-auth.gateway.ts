import { Injectable } from '@angular/core';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AppRole, AuthSession } from '../models/app.models';
import { AuthGateway } from './auth.gateway';
import { injectSupabaseClient } from './supabase.client';

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: AppRole | null;
  is_active: boolean;
  organization_id: string | null;
};

type SiteAccessRow = {
  site_id: string;
};

@Injectable()
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = injectSupabaseClient();
  private authSubscriptionStarted = false;
  private readonly listeners = new Set<(session: AuthSession | null) => void>();

  async loadSession(): Promise<AuthSession | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) return null;
    return await this.buildSession(data.user.id, data.user.email ?? '');
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const email = username.trim().toLowerCase();
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: password.trim() });
    if (error || !data.user) return null;

    const session = await this.buildSession(data.user.id, data.user.email ?? email);
    if (!session) return null;
    try {
      await this.recordAuthEvent('login');
      return session;
    } catch {
      await this.supabase.auth.signOut();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.recordAuthEvent('logout');
    } finally {
      await this.supabase.auth.signOut();
    }
  }

  subscribeToSession(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    this.ensureAuthSubscription();
    return () => this.listeners.delete(listener);
  }

  private async buildSession(userId: string, fallbackEmail: string): Promise<AuthSession | null> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('id, username, display_name, role, is_active, organization_id')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    if (error || !profile?.role || !profile.is_active || !profile.organization_id) {
      await this.supabase.auth.signOut();
      return null;
    }

    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    const { data: sessionData } = await this.supabase.auth.getSession();
    if (userError || userData.user?.id !== userId || !sessionData.session) {
      await this.supabase.auth.signOut();
      return null;
    }

    const { data: siteAccess, error: siteAccessError } = await this.supabase
      .from('profile_site_access')
      .select('site_id')
      .eq('profile_id', userId);

    if (siteAccessError) {
      await this.supabase.auth.signOut();
      return null;
    }

    const session = sessionData.session;
    return {
      userId,
      username: profile.username || fallbackEmail || userId,
      role: profile.role,
      displayName: profile.display_name || fallbackEmail || 'Unknown User',
      organizationId: profile.organization_id,
      permittedSiteIds: (siteAccess as SiteAccessRow[] | null)?.map((entry) => entry.site_id) || [],
      issuedAt: session.user.last_sign_in_at || session.user.created_at,
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    };
  }

  private ensureAuthSubscription() {
    if (this.authSubscriptionStarted) return;
    this.authSubscriptionStarted = true;
    this.supabase.auth.onAuthStateChange((event, session) => void this.handleAuthStateChange(event, session));
  }

  private async handleAuthStateChange(event: AuthChangeEvent, session: Session | null) {
    if (event === 'SIGNED_OUT' || !session?.user) {
      this.emit(null);
      return;
    }
    if (event !== 'TOKEN_REFRESHED' && event !== 'USER_UPDATED') return;
    const authSession = await this.buildSession(session.user.id, session.user.email ?? '');
    this.emit(authSession);
  }

  private async recordAuthEvent(eventType: 'login' | 'logout') {
    const { data } = await this.supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await this.supabase.from('auth_activity_events').insert({
      actor_id: data.user.id,
      target_profile_id: data.user.id,
      event_type: eventType,
      details: {},
    });
    if (error) throw error;
  }

  private emit(session: AuthSession | null) {
    for (const listener of this.listeners) listener(session);
  }
}
