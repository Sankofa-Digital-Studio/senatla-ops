import { DailyLog } from './app.models';

export interface TimesheetRegisterRow {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  siteId: string;
  siteName: string;
  workDate: string;
  status: DailyLog['status'];
  reason: DailyLog['reason'];
  comment: string;
  isFlagged: boolean;
  hasEvidence: boolean;
  capturedAt: Date | null;
}

export interface TimesheetRegisterSummary {
  total: number;
  present: number;
  absent: number;
  pending: number;
  flagged: number;
  evidence: number;
  completionPercent: number;
}
