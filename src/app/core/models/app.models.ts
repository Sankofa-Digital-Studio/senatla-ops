export type AppRole = 'site' | 'office' | 'director';

export const SENATLA_TRADING_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';

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
  actor?: string;
  attendanceSummary?: {
    present: number;
    absent: number;
    pending: number;
    flagged: number;
    evidenceCount: number;
  };
}

export interface Site {
  id: string;
  organizationId?: string;
  name: string;
  location: string;
  managerId?: string;
  isActive: boolean;
}

// Support for SA Labour Law UI-19 & Payroll
export interface Employee {
  id: string;
  organizationId?: string;
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
  employmentStatus?: EmploymentStatus;
  
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
  userId: string;
  username: string;
  role: AppRole;
  displayName: string;
  issuedAt: string;
  expiresAt: string;
}

export interface Issue {
  id: string;
  organizationId?: string;
  siteId: string;
  reportedBy: string;
  dateReported: Date;
  category: 'Safety' | 'Payroll' | 'Discipline' | 'Operations';
  description: string;
  status: 'Open' | 'Resolved' | 'Escalated';
  auditTrail: { date: Date, action: string, user: string }[];
  severity?: IssueSeverity;
  ownerProfileId?: string | null;
  dueAt?: string | null;
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

export type EmploymentStatus = 'active' | 'inactive' | 'suspended';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PayrollPeriodStatus = 'open' | 'locked' | 'exported';

export interface ManagedUserProfile {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminAuditEvent {
  id: string;
  action:
    | 'sensitive_ids_shown'
    | 'sensitive_ids_hidden'
    | 'masked_payroll_export'
    | 'full_payroll_export';
  occurredAt: Date;
  actor: string;
  details?: string;
}

export interface AttendanceAuditEvent {
  id: string;
  action:
    | 'attendance_marked_present'
    | 'attendance_marked_absent'
    | 'attendance_marked_pending'
    | 'attendance_reason_updated'
    | 'attendance_comment_updated'
    | 'safety_talk_completed'
    | 'safety_talk_updated'
    | 'sync_submitted';
  occurredAt: Date;
  actor: string;
  employeeId?: string;
  employeeName?: string;
  siteId?: string;
  details?: string;
}
export interface VehicleAsset {
  id: string;
  organizationId?: string;
  registrationNumber?: string; // e.g. ABC 123 GP
  serialNumber?: string; // Manufacturer or equipment serial number
  vin?: string;
  make: string;
  model: string;
  type: 'Heavy Duty' | 'Light Vehicle' | 'Yellow Metal';
  licenseExpiry: string; // YYYY-MM-DD
  status: 'Active' | 'Maintenance' | 'Expired';
  assignedSiteId?: string;
  notes?: string;
  custodianName?: string;
  assetClass?: string;
  lifecycleState?: AssetLifecycleState;
  retiredAt?: string | null;
}

export type AssetRegistrationState = 'draft' | 'review_required' | 'ready' | 'completed';
export type AssetEvidenceType =
  | 'asset_photo'
  | 'number_plate'
  | 'licence_disc'
  | 'registration_document'
  | 'purchase_invoice'
  | 'other';

export interface AssetRegistrationDraft {
  id: string;
  organizationId: string;
  ownerId: string;
  ownerName: string;
  state: AssetRegistrationState;
  asset: VehicleAsset;
  createdAt: string;
  updatedAt: string;
  completedAssetId?: string | null;
}

export interface AssetRegistrationEvidence {
  id: string;
  organizationId: string;
  draftId: string;
  uploadedBy: string;
  evidenceType: AssetEvidenceType;
  fileName: string;
  mimeType: string;
  storagePath?: string | null;
  previewUrl?: string | null;
  extractionState: 'not_applicable' | 'pending' | 'review_required' | 'applied';
  extractedFields: Partial<Pick<VehicleAsset, 'registrationNumber' | 'vin' | 'serialNumber' | 'make' | 'model' | 'licenseExpiry'>>;
  rawExtraction?: string | null;
  createdAt: string;
}

export interface AssetReminderMilestone {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  phase: 'expiry' | 'grace';
}

export type AssetLifecycleState = 'active' | 'maintenance' | 'retired' | 'disposed';
export type ComplianceStatus = 'valid' | 'due' | 'expired' | 'waived';
export type WorkOrderStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface AssetCustodyEvent {
  id: string;
  organizationId: string;
  assetId: string;
  fromSiteId?: string | null;
  toSiteId?: string | null;
  fromCustodian?: string | null;
  toCustodian?: string | null;
  acceptedBy?: string | null;
  occurredAt: string;
  notes?: string;
}

export interface AssetComplianceRecord {
  id: string;
  organizationId: string;
  assetId: string;
  complianceType: 'licence' | 'roadworthy' | 'insurance' | 'inspection' | 'certification' | 'warranty' | 'other';
  referenceNumber?: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: ComplianceStatus;
  documentPath?: string;
  notes?: string;
}

export interface AssetMeterReading {
  id: string;
  organizationId: string;
  assetId: string;
  meterType: 'odometer_km' | 'engine_hours' | 'cycles';
  reading: number;
  recordedAt: string;
  recordedBy: string;
  source: 'manual' | 'import' | 'telematics';
}

export interface AssetWorkOrder {
  id: string;
  organizationId: string;
  assetId: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueAt?: string | null;
  completedAt?: string | null;
  cost: number;
}

export interface AssetMaintenancePlan {
  id: string;
  organizationId: string;
  assetId: string;
  name: string;
  intervalDays?: number | null;
  intervalMeter?: number | null;
  meterType?: AssetMeterReading['meterType'] | null;
  nextDueAt?: string | null;
  nextDueMeter?: number | null;
  isActive: boolean;
}

export interface IntegrationOutboxEvent {
  id: string;
  organizationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  idempotencyKey: string;
  attempts: number;
  createdAt: string;
  processedAt?: string | null;
}

export interface AssetImportConflict {
  rowNumber: number;
  identifier: string;
  reason: string;
}

export interface AssetImportPreview {
  validAssets: VehicleAsset[];
  conflicts: AssetImportConflict[];
  totalRows: number;
}

export interface AdminActivityEvent {
  id: string;
  organizationId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorId: string;
  actorName: string;
  details?: Record<string, unknown> | null;
  occurredAt: string;
}

export interface PayrollPeriod {
  id: string;
  organizationId?: string;
  periodKey: string;
  month: number;
  year: number;
  status: PayrollPeriodStatus;
  lockedAt?: string | null;
  lockedBy?: string | null;
}

export interface PayrollExportRecord {
  id: string;
  organizationId?: string;
  periodKey: string;
  includeFullIds: boolean;
  requestedBy: string;
  fileName: string;
  createdAt: string;
}

export type ApprovalRequestType = 'full_id_payroll_export' | 'user_suspension' | 'asset_return_to_service';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed';

export interface ApprovalRequest {
  id: string;
  organizationId?: string;
  requestType: ApprovalRequestType;
  status: ApprovalStatus;
  requestedBy: string;
  requestedByName: string;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  reviewedAt?: string | null;
  notes?: string | null;
}

export interface SavedAdminView {
  id: string;
  organizationId?: string;
  name: string;
  filters: {
    tab: string;
    searchTerm?: string;
    siteId?: string;
  };
  createdBy: string;
  createdAt: string;
}

export interface AdminAnomaly {
  id: string;
  type: 'duplicate_id' | 'expired_asset' | 'critical_issue' | 'inactive_user' | 'unassigned_employee';
  severity: 'medium' | 'high' | 'critical';
  title: string;
  detail: string;
  entityId?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}



