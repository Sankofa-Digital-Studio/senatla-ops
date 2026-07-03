import {
  AdminActivityEvent,
  AdminAnomaly,
  AssetComplianceRecord,
  AssetCustodyEvent,
  AssetMaintenancePlan,
  AssetMeterReading,
  AssetWorkOrder,
  ApprovalRequest,
  Employee,
  FinancialType,
  Group,
  Issue,
  IntegrationOutboxEvent,
  Organization,
  ManagedUserProfile,
  PayrollExportRecord,
  PayrollPeriod,
  SavedAdminView,
  Site,
  VehicleAsset,
} from './app.models';

export interface OfficeAdminWorkspace {
  users: ManagedUserProfile[];
  sites: Site[];
  groups: Group[];
  employees: Employee[];
  financialTypes: FinancialType[];
  issues: Issue[];
  assets: VehicleAsset[];
  assetCustodyEvents: AssetCustodyEvent[];
  assetComplianceRecords: AssetComplianceRecord[];
  assetMeterReadings: AssetMeterReading[];
  assetWorkOrders: AssetWorkOrder[];
  assetMaintenancePlans: AssetMaintenancePlan[];
  integrationOutbox: IntegrationOutboxEvent[];
  activity: AdminActivityEvent[];
  payrollPeriods: PayrollPeriod[];
  payrollExports: PayrollExportRecord[];
  approvals: ApprovalRequest[];
  savedViews: SavedAdminView[];
  organizations: Organization[];
  anomalies: AdminAnomaly[];
}

export interface UserInviteInput {
  email: string;
  displayName: string;
  role: 'site' | 'office' | 'director';
}
