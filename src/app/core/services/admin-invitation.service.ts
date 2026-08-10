import { Injectable, inject, signal } from '@angular/core';
import { RUNTIME_CONFIG, RuntimeConfig } from '../config/runtime-config';
import { injectSupabaseClient } from '../gateways/supabase.client';
import { AdminInvitation, AdminInvitationInput } from '../models/admin-invitation.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminInvitationService {
  private readonly auth = inject(AuthService);
  private readonly config = inject<RuntimeConfig>(RUNTIME_CONFIG);
  private readonly supabase = this.config.api.mode === 'supabase' ? injectSupabaseClient() : null;
  readonly invitations = signal<AdminInvitation[]>([]);
  readonly loading = signal(false);

  async load() {
    if (!this.supabase) return;
    this.loading.set(true);
    try { const payload = await this.request('GET') as { invitations?: AdminInvitation[] }; this.invitations.set(payload.invitations || []); }
    finally { this.loading.set(false); }
  }
  async issue(input: AdminInvitationInput) {
    if (!this.supabase) {
      const code = `LOCAL-${crypto.randomUUID()}`; const invitation = this.localInvitation(input);
      this.invitations.update((entries) => [invitation, ...entries]); return { invitation, code };
    }
    const payload = await this.request('POST', input) as { invitation: AdminInvitation; code: string };
    this.invitations.update((entries) => [payload.invitation, ...entries]); return payload;
  }
  async revoke(invitationId: string) {
    if (this.supabase) await this.request('DELETE', { invitationId });
    this.invitations.update((entries) => entries.map((entry) => entry.id === invitationId
      ? { ...entry, status: 'revoked', revokedAt: new Date().toISOString() } : entry));
  }
  private async request(method: 'GET' | 'POST' | 'DELETE', body?: object) {
    const { data } = await this.supabase!.auth.getSession(); const token = data.session?.access_token;
    if (!token) throw new Error('Your authenticated session is required.');
    const response = await fetch(`${this.config.api.baseUrl || ''}/api/admin/invitations`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload['error'] === 'string' ? payload['error'] : 'Invitation action failed.');
    return payload;
  }
  private localInvitation(input: AdminInvitationInput): AdminInvitation {
    const now = new Date();
    return { id: crypto.randomUUID(), label: input.label, codeSuffix: 'local', expiresAt: new Date(now.getTime() + input.expiresInHours * 3600000).toISOString(),
      maxUses: input.maxUses, usedCount: 0, status: 'active', createdAt: now.toISOString(), createdByName: this.auth.displayName(), lastUsedAt: null, revokedAt: null };
  }
}
