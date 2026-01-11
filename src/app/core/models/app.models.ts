export interface DailyLog {
  date: string;
  status: 'present' | 'absent' | 'pending';
  reason?: 'Sick' | 'Family' | 'AWOL' | 'Confirm in Office' | null;
  comment?: string;
  isFlagged?: boolean;
  lastUpdated?: Date;
}

export interface SyncRecord {
  siteId: string;
  syncTime: Date;
  status: 'On Time' | 'Late' | 'Critical' | 'Rollover';
  acknowledgedWarning?: boolean;
  signatureData?: string; // Base64 signature
  safetyTopic?: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'General Worker' | 'Safety Rep' | 'Operator' | 'Driver' | 'Foreman';
  rate: number;
  groupId?: string; 
  logs: Record<string, DailyLog>; 
}