import { Injectable } from '@angular/core';
import { AppStateGateway, AppStateSnapshot } from './app-state.gateway';
import { AdminAuditEvent, AttendanceAuditEvent } from '../models/app.models';
import { injectSupabaseClient } from './supabase.client';

type SnapshotRow = {
  user_id: string;
  snapshot: AppStateSnapshot;
  updated_at?: string;
};

@Injectable()
export class SupabaseAppStateGateway implements AppStateGateway {
  private readonly supabase = injectSupabaseClient();

  async loadState(): Promise<AppStateSnapshot | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabase
      .from('app_state_snapshots')
      .select('user_id, snapshot, updated_at')
      .eq('user_id', userId)
      .maybeSingle<SnapshotRow>();

    if (error || !data?.snapshot) {
      return null;
    }

    return data.snapshot;
  }

  async saveState(snapshot: AppStateSnapshot): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    const { error } = await this.supabase
      .from('app_state_snapshots')
      .upsert(
        {
          user_id: userId,
          snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      throw error;
    }
  }

  async loadAdminAuditTrail(): Promise<AdminAuditEvent[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('admin_audit_events')
      .select('id, actor_name, action, details, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(25);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      actor: row.actor_name,
      action: row.action as AdminAuditEvent['action'],
      details: row.details || undefined,
      occurredAt: new Date(row.occurred_at),
    }));
  }

  async loadAttendanceAuditTrail(): Promise<AttendanceAuditEvent[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('attendance_audit_events')
      .select('id, actor_name, employee_id, employee_name, site_id, action, details, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(40);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      actor: row.actor_name,
      employeeId: row.employee_id || undefined,
      employeeName: row.employee_name || undefined,
      siteId: row.site_id || undefined,
      action: row.action as AttendanceAuditEvent['action'],
      details: row.details || undefined,
      occurredAt: new Date(row.occurred_at),
    }));
  }

  async appendAdminAuditEvent(event: AdminAuditEvent): Promise<void> {
    const userId = await this.requireCurrentUserId();
    const { error } = await this.supabase.from('admin_audit_events').insert({
      id: event.id,
      actor_id: userId,
      actor_name: event.actor,
      action: event.action,
      details: event.details || null,
      occurred_at: event.occurredAt.toISOString(),
    });
    if (error) throw error;
  }

  async appendAttendanceAuditEvent(event: AttendanceAuditEvent): Promise<void> {
    const userId = await this.requireCurrentUserId();
    const { error } = await this.supabase.from('attendance_audit_events').insert({
      id: event.id,
      actor_id: userId,
      actor_name: event.actor,
      employee_id: event.employeeId || null,
      employee_name: event.employeeName || null,
      site_id: event.siteId || null,
      action: event.action,
      details: event.details || null,
      occurred_at: event.occurredAt.toISOString(),
    });
    if (error) throw error;
  }

  private async requireCurrentUserId(): Promise<string> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('An authenticated user is required to write audit events.');
    return userId;
  }

  private async getCurrentUserId(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }
}
