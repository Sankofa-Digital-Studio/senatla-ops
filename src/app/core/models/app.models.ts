export type AppRole = 'site' | 'office' | 'director';

export interface DailyLog {
  date: string;
  status: 'present' | 'absent' | 'pending';
  reason?: 'Sick' | 'Family' | 'AWOL' | 'Confirm in Office' | null;
  comment?: string;
  isFlagged?: boolean;
  lastUpdated?: Date;
  evidence?: AttendanceEvidence | null;
}

export interface AttendanceEvidence {
  photoDataUrl: string;
  capturedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface SyncRecord {
  siteId: string;
  syncTime: Date;
  status: 'On Time' | 'Late' | 'Critical' | 'Rollover';
  acknowledgedWarning?: boolean;
  signatureData?: string;
  safetyTopic?: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  managerId?: string;
  isActive: boolean;
}

// Support for SA Labour Law UI-19 & Payroll
export interface Employee {
  id: string;
  firstName: string;
  surname: string;
  idNumber: string;
  role: 'General Worker' | 'Safety Rep' | 'Operator' | 'Driver' | 'Foreman';
  siteId: string;
  groupId?: string;
  startDate: string;
  basicRate: number;
  
  // New fields
  salaryAdvances: number;
  financials: Record<string, number>;
  
  logs: Record<string, DailyLog>;
  adjustments: Record<string, number>;
  
  // Optional for legacy support if needed
  travelAllowance?: number;
  housingAllowance?: number;
  taxRefNumber?: string;
}

export interface DemoUser {
  username: string;
  password: string;
  role: AppRole;
  displayName: string;
}

export interface AuthSession {
  username: string;
  role: AppRole;
  displayName: string;
}

export interface Issue {
  id: string;
  siteId: string;
  reportedBy: string;
  dateReported: Date;
  category: 'Safety' | 'Payroll' | 'Discipline' | 'Operations';
  description: string;
  status: 'Open' | 'Resolved' | 'Escalated';
  auditTrail: { date: Date, action: string, user: string }[];
}

export interface Group {
  id: string;
  name: string;
}

export interface SafetyTalkRecord {
  id: string;
  date: Date;
  topic: string;
  notes?: string;
  photoUrl?: string;
}

export interface FinancialType {
  id: string;
  name: string;
  category: 'Allowance' | 'Deduction';
  isActive: boolean;
  isSystem?: boolean;
}
export interface VehicleAsset {
  id: string;
  registrationNumber?: string; // e.g. ABC 123 GP
  serialNumber?: string; // e.g. ABC 123 GP
  vin: string;
  make: string;
  model: string;
  type: 'Heavy Duty' | 'Light Vehicle' | 'Yellow Metal';
  licenseExpiry: string; // YYYY-MM-DD
  status: 'Active' | 'Maintenance' | 'Expired';
}



