import { InjectionToken } from '@angular/core';
import { AdminAuditEvent, Employee, FinancialType, Group, Issue, SafetyTalkRecord, Site, SyncRecord } from '../models/app.models';

export interface AppStateSnapshot {
  siteName: string;
  sites: Site[];
  employees: Employee[];
  issues: Issue[];
  groups: Group[];
  financialTypes: FinancialType[];
  adminAuditTrail: AdminAuditEvent[];
  safetyTopics: string[];
  syncHistory: SyncRecord[];
  lastSyncTime: string | null;
  safetyTalks: SafetyTalkRecord[];
}

export interface AppStateGateway {
  loadState(): Promise<AppStateSnapshot | null>;
  saveState(snapshot: AppStateSnapshot): Promise<void>;
}

export const APP_STATE_GATEWAY = new InjectionToken<AppStateGateway>('APP_STATE_GATEWAY');
