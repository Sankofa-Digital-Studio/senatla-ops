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
  managerId?: string; // Links to an employee
  isActive: boolean;
}

// Support for SA Labour Law UI-19 & Payroll
export interface Employee {
  id: string;
  // Personal
  firstName: string;
  surname: string;
  idNumber: string; // SA ID
  
  // Employment
  role: 'General Worker' | 'Safety Rep' | 'Operator' | 'Driver' | 'Foreman';
  siteId: string; // Links to Site
  groupId?: string; 
  startDate: string; // YYYY-MM-DD
  taxRefNumber?: string;
  
  // Financials (ZAR)
  basicRate: number; // Daily Rate
  travelAllowance: number;
  housingAllowance: number;
  
  logs: Record<string, DailyLog>; 
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