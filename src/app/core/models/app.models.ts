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
  // Personal
  firstName: string;
  surname: string;
  idNumber: string; 
  
  // Employment
  role: 'General Worker' | 'Safety Rep' | 'Operator' | 'Driver' | 'Foreman';
  siteId: string; 
  groupId?: string; 
  startDate: string; 
  taxRefNumber?: string;
  
  // Financials (ZAR)
  basicRate: number; 
  travelAllowance: number;
  housingAllowance: number;
  salaryAdvances: number; // Added field
  
  logs: Record<string, DailyLog>; 
  
  // New: Manual Adjustments Record
  // Key: "YYYY-MM-WeekIndex" -> Value: Number of days added/removed
  adjustments: Record<string, number>; 
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
  photoUrl?: string; // Base64 or URL
}
