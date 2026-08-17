import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TimesheetSummaryComponent } from '../../components/timesheet-summary.component';
import { AdminInvitationManagerComponent } from '../../components/admin-invitation-manager/admin-invitation-manager.component';
import { UiButtonComponent } from '../../components/ui-button.component';
import { UiFeedbackComponent } from '../../components/ui-feedback.component';
import { UiTabNavComponent } from '../../components/ui-tab-nav.component';
import {
  Employee,
  EmployeeOnboardingRecord,
  PpeIssueRecord,
  EmploymentStatus,
  FinancialType,
  Issue,
  IssueSeverity,
  ManagedUserProfile,
  Site,
  VendorAccount,
  VendorInvoiceRecord,
  VehicleAsset,
} from '../../core/models/app.models';
import { UserInviteInput } from '../../core/models/office-admin.models';
import { OfficeAdminService } from '../../core/services/office-admin.service';
import { TimesheetRegisterService } from '../../core/services/timesheet-register.service';
import { downloadTextFile } from '../../core/utils/browser-file.util';

type AdminTab = 'overview' | 'users' | 'people' | 'workforce' | 'timesheets' | 'sites' | 'issues' | 'assets' | 'payroll' | 'vendors' | 'approvals' | 'recovery' | 'activity' | 'settings' | 'account';

@Component({
  selector: 'app-office-admin',
  templateUrl: './office-admin.component.html',
  styleUrls: ['./office-admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, RouterLink, TimesheetSummaryComponent, AdminInvitationManagerComponent, UiButtonComponent, UiFeedbackComponent, UiTabNavComponent],
})
export class OfficeAdminComponent {
  readonly service = inject(OfficeAdminService);
  private readonly timesheetRegister = inject(TimesheetRegisterService);

  readonly tabs: { id: AdminTab; label: string; group: string }[] = [
    { id: 'overview', label: 'Overview', group: 'Workspace' },
    { id: 'people', label: 'Current', group: 'Workforce' },
    { id: 'workforce', label: 'New Hires & PPE', group: 'Workforce' },
    { id: 'timesheets', label: 'Timesheets & Payroll', group: 'Workforce' },
    { id: 'users', label: 'Access Control', group: 'Administration' },
    { id: 'sites', label: 'Sites', group: 'Operations' },
    { id: 'assets', label: 'Assets', group: 'Operations' },
    { id: 'issues', label: 'Issues', group: 'Operations' },
    { id: 'payroll', label: 'Payroll', group: 'Finance' },
    { id: 'vendors', label: 'Vendors', group: 'Finance' },
    { id: 'approvals', label: 'Approvals', group: 'Finance' },
    { id: 'recovery', label: 'Recovery', group: 'System' },
    { id: 'activity', label: 'Activity', group: 'System' },
    { id: 'settings', label: 'Settings', group: 'System' },
    { id: 'account', label: 'Account', group: 'System' },
  ];
  readonly activeTab = signal<AdminTab>('overview');
  readonly searchTerm = signal('');
  readonly selectedSiteId = signal('');
  readonly timesheetDate = signal(this.timesheetRegister.toDateKey(new Date()));
  readonly selectedEmployeeIds = signal<string[]>([]);
  readonly selectedEmployeeId = signal('');
  readonly showEmployeeForm = signal(false);
  readonly bulkSiteId = signal('');
  readonly month = signal(new Date().getMonth());
  readonly year = signal(new Date().getFullYear());
  readonly includeFullIds = signal(false);
  readonly busy = signal(false);
  readonly feedback = signal('');
  readonly resetLink = signal('');
  readonly onboardingProgress = computed(() => {
    const records = this.service.employeeOnboarding();
    if (!records.length) return 0;
    const completed = records.filter((record) => record.criminalCheckStatus === 'clear' && record.fingerprintCheckStatus === 'clear' && record.medicalStatus === 'fit').length;
    return Math.round((completed / records.length) * 100);
  });
  readonly syncProgress = computed(() => {
    const records = this.service.integrationOutbox();
    if (!records.length) return 100;
    return Math.round((records.filter((record) => record.status === 'completed').length / records.length) * 100);
  });
  viewName = '';

  inviteForm: UserInviteInput = {
    email: '',
    displayName: '',
    role: 'site',
  };
  siteForm: Site = {
    id: '',
    name: '',
    location: '',
    managerId: undefined,
    teamName: '',
    jobNumber: '',
    estimatedDuration: '',
    complianceChecklist: [],
    isActive: true,
  };
  personForm: Employee & { employmentStatus?: EmploymentStatus } = {
    id: '',
    firstName: '',
    surname: '',
    idNumber: '',
    role: 'General Worker',
    siteId: '',
    startDate: new Date().toISOString().slice(0, 10),
    basicRate: 0,
    salaryAdvances: 0,
    financials: { travel: 0, housing: 0, advance: 0 },
    logs: {},
    adjustments: {},
    employmentStatus: 'active',
  };
  issueForm: Issue & { severity?: IssueSeverity; ownerProfileId?: string | null; dueAt?: string | null } = {
    id: '',
    siteId: '',
    reportedBy: '',
    dateReported: new Date(),
    category: 'Operations',
    description: '',
    status: 'Open',
    auditTrail: [],
    severity: 'medium',
    ownerProfileId: null,
    dueAt: null,
  };
  onboardingForm: Omit<EmployeeOnboardingRecord, 'id' | 'organizationId' | 'updatedAt'> & { id?: string } = {
    employeeId: '', criminalCheckStatus: 'pending', fingerprintCheckStatus: 'pending', medicalStatus: 'pending', redTicketNumber: '', redTicketIssuedAt: null, redTicketExpiresAt: null, notes: '',
  };
  ppeForm: Omit<PpeIssueRecord, 'id' | 'organizationId' | 'requestedAt'> & { id?: string; requestedAt?: string } = {
    employeeId: '', itemType: 'overall_pants', brand: '', size: '', unitCost: 0, orderDate: null, collectionDate: null, status: 'requested', officeConfirmedAt: null, officeConfirmedBy: null, employeeConfirmedAt: null, employeeConfirmedBy: null,
  };
  financialTypeForm: FinancialType = {
    id: '',
    name: '',
    category: 'Allowance',
    isActive: true,
  };
  vendorForm: Omit<VendorAccount, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> & { id?: string } = {
    name: '',
    description: '',
    totalOwingAmount: 0,
  };
  vendorInvoiceForm: Omit<VendorInvoiceRecord, 'id' | 'organizationId' | 'status' | 'requestedBy' | 'requestedByName' | 'directorReviewedBy' | 'directorReviewedAt' | 'createdAt' | 'updatedAt'> & { id?: string } = {
    vendorId: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    orderNumber: '',
    itemsPurchased: '',
    total: 0,
    responsiblePerson: '',
  };
  siteComplianceText = '';

  readonly selectedEmployee = computed(() => {
    const selectedId = this.selectedEmployeeId();
    return this.service.employees().find((employee) => employee.id === selectedId) || this.filteredEmployees()[0] || null;
  });
  readonly selectedEmployeeAssets = computed<VehicleAsset[]>(() => {
    const employee = this.selectedEmployee();
    if (!employee) return [];
    const fullName = `${employee.firstName} ${employee.surname}`.trim().toLowerCase();
    return this.service.assets().filter((asset) => (asset.custodianName || '').trim().toLowerCase() === fullName);
  });
  readonly selectedEmployeeOpenIssues = computed(() => {
    const employee = this.selectedEmployee();
    if (!employee) return [];
    const fullName = `${employee.firstName} ${employee.surname}`.trim().toLowerCase();
    return this.service.issues().filter((issue) => issue.status === 'Open' && (issue.reportedBy.trim().toLowerCase() === fullName || issue.description.toLowerCase().includes(employee.surname.toLowerCase())));
  });
  readonly filteredEmployees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const siteId = this.selectedSiteId();
    return this.service.employees().filter((employee) => {
      const matchesTerm = !term
        || employee.firstName.toLowerCase().includes(term)
        || employee.surname.toLowerCase().includes(term)
        || this.service.maskIdNumber(employee.idNumber).toLowerCase().includes(term);
      const matchesSite = !siteId || employee.siteId === siteId;
      return matchesTerm && matchesSite;
    });
  });

  employeeName(employeeId: string) {
    const employee = this.service.employees().find((entry) => entry.id === employeeId);
    return employee ? `${employee.firstName} ${employee.surname}` : 'Unknown employee';
  }

  async importEmployees(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy.set(true); this.feedback.set('');
    try {
      const rows = this.parseCsv(await file.text());
      let imported = 0;
      for (const row of rows) {
        await this.service.saveEmployee({ id: '', firstName: row['first_name'] || row['firstname'] || '', surname: row['surname'] || '', idNumber: row['id_number'] || row['idnumber'] || '', role: (row['role'] as Employee['role']) || 'General Worker', siteId: row['site_id'] || '', startDate: row['start_date'] || new Date().toISOString().slice(0, 10), basicRate: Number(row['basic_rate'] || 0), salaryAdvances: 0, financials: { travel: 0, housing: 0, advance: 0 }, logs: {}, adjustments: {}, employmentStatus: 'active' });
        imported += 1;
      }
      this.feedback.set(`${imported} employee(s) imported from CSV.`);
    } catch (error) { this.feedback.set(error instanceof Error ? error.message : 'Employee import failed.'); }
    finally { this.busy.set(false); input.value = ''; }
  }

  async submitOnboarding() { await this.runAction(async () => { await this.service.saveEmployeeOnboarding(this.onboardingForm); this.feedback.set('New-hire checks saved.'); }); }
  async submitPpe() { await this.runAction(async () => { await this.service.savePpeIssue(this.ppeForm); this.feedback.set('PPE record saved.'); }); }
  async confirmPpe(id: string, party: 'office' | 'employee') { await this.runAction(async () => { await this.service.confirmPpeIssue(id, party); this.feedback.set(party === 'office' ? 'Office confirmation recorded.' : 'Employee confirmation recorded.'); }); }

  private parseCsv(text: string) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('CSV must contain a header and at least one employee row.');
    const split = (line: string) => { const values: string[] = []; let value = ''; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; } else value += char; } values.push(value.trim()); return values; };
    const headers = split(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map((line) => { const row: Record<string, string> = {}; split(line).forEach((value, index) => { if (headers[index]) row[headers[index]] = value; }); return row; });
  }
  readonly payrollPeriod = computed(() => {
    const key = `${this.year()}-${`${this.month() + 1}`.padStart(2, '0')}`;
    return this.service.payrollPeriods().find((entry) => entry.periodKey === key) || null;
  });
  readonly openIssuesCount = computed(() => this.service.issues().filter((issue) => issue.status === 'Open').length);
  readonly timesheetRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const siteId = this.selectedSiteId();
    return this.timesheetRegister
      .buildRows(this.service.activeEmployees(), this.service.sites(), this.timesheetDate())
      .filter((row) => (!term || row.employeeName.toLowerCase().includes(term) || row.employeeRole.toLowerCase().includes(term))
        && (!siteId || row.siteId === siteId));
  });
  readonly timesheetSummary = computed(() => this.timesheetRegister.summarize(this.timesheetRows()));
  readonly recoveryOutbox = computed(() => this.service.integrationOutbox()
    .filter((event) => event.status === 'pending' || event.status === 'failed')
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'failed' ? -1 : 1;
      return right.createdAt.localeCompare(left.createdAt);
    }));

  async submitInvite() {
    await this.runAction(async () => {
      const created = await this.service.inviteUser(this.inviteForm);
      this.feedback.set(`User invited: ${created.username}`);
      this.inviteForm = { email: '', displayName: '', role: 'site' };
    });
  }

  async submitSite() {
    await this.runAction(async () => {
      await this.service.saveSite({ ...this.siteForm, complianceChecklist: this.parseChecklist(this.siteComplianceText) });
      this.feedback.set('Site saved.');
      this.siteForm = { id: '', name: '', location: '', managerId: undefined, teamName: '', jobNumber: '', estimatedDuration: '', complianceChecklist: [], isActive: true };
      this.siteComplianceText = '';
    });
  }

  async submitEmployee() {
    await this.runAction(async () => {
      await this.service.saveEmployee(this.personForm);
      this.feedback.set('Employee saved.');
      this.resetEmployeeForm();
      this.showEmployeeForm.set(false);
    });
  }

  async submitIssue() {
    await this.runAction(async () => {
      await this.service.saveIssue(this.issueForm);
      this.feedback.set('Issue saved.');
      this.issueForm = {
        id: '',
        siteId: '',
        reportedBy: '',
        dateReported: new Date(),
        category: 'Operations',
        description: '',
        status: 'Open',
        auditTrail: [],
        severity: 'medium',
        ownerProfileId: null,
        dueAt: null,
      };
    });
  }

  async submitVendorAccount() {
    await this.runAction(async () => {
      const vendor = await this.service.saveVendorAccount(this.vendorForm);
      this.feedback.set(`Vendor saved: ${vendor.name}`);
      this.vendorInvoiceForm.vendorId = vendor.id;
      this.vendorForm = { name: '', description: '', totalOwingAmount: 0 };
    });
  }

  async submitVendorInvoice() {
    await this.runAction(async () => {
      await this.service.submitVendorInvoice(this.vendorInvoiceForm);
      this.feedback.set('Invoice submitted to Director approval queue.');
      this.vendorInvoiceForm = { vendorId: '', invoiceDate: new Date().toISOString().slice(0, 10), orderNumber: '', itemsPurchased: '', total: 0, responsiblePerson: '' };
    });
  }
  async submitFinancialType() {
    await this.runAction(async () => {
      await this.service.saveFinancialType(this.financialTypeForm);
      this.feedback.set('Financial type saved.');
      this.financialTypeForm = { id: '', name: '', category: 'Allowance', isActive: true };
    });
  }

  async updateUser(user: ManagedUserProfile, role: string, isActive: boolean) {
    await this.runAction(async () => {
      const normalizedRole = role === 'site' || role === 'office' || role === 'director' ? role : user.role;
      await this.service.saveUser({ ...user, role: normalizedRole, isActive });
      this.feedback.set(`User updated: ${user.username}`);
    });
  }

  async suspendUser(user: ManagedUserProfile) {
    await this.runAction(async () => {
      await this.service.submitApprovalRequest('user_suspension', {
        userId: user.id,
        username: user.username,
      });
      this.feedback.set(`Suspension request submitted for ${user.username}`);
    });
  }

  async reactivateUser(user: ManagedUserProfile) {
    await this.runAction(async () => {
      await this.service.setUserAccessState(user.id, true);
      this.feedback.set(`Reactivated ${user.username}`);
    });
  }

  async resetUserPassword(user: ManagedUserProfile) {
    await this.runAction(async () => {
      const result = await this.service.requestPasswordReset(user.id);
      this.resetLink.set(result.resetLink || '');
      this.feedback.set(result.message);
    });
  }

  async setEmployeeStatus(employeeId: string, employmentStatus: EmploymentStatus) {
    await this.runAction(async () => {
      await this.service.updateEmployeeStatus(employeeId, employmentStatus);
      this.feedback.set('Employee status updated.');
    });
  }

  toggleSelectedEmployee(employeeId: string, checked: boolean) {
    const current = new Set(this.selectedEmployeeIds());
    if (checked) current.add(employeeId);
    else current.delete(employeeId);
    this.selectedEmployeeIds.set([...current]);
  }

  async runBulkSiteAssignment() {
    await this.runAction(async () => {
      await this.service.bulkAssignSite(this.selectedEmployeeIds(), this.bulkSiteId());
      this.feedback.set('Employees reassigned.');
      this.selectedEmployeeIds.set([]);
      this.bulkSiteId.set('');
    });
  }

  async exportPayroll() {
    await this.runAction(async () => {
      if (this.includeFullIds()) {
        await this.service.submitApprovalRequest('full_id_payroll_export', {
          month: this.month(),
          year: this.year(),
        });
        this.feedback.set('Full-ID export sent for approval.');
        return;
      }

      const csv = this.service.generatePayrollCsv(this.month(), this.year(), this.includeFullIds());
      const periodKey = `${this.year()}-${`${this.month() + 1}`.padStart(2, '0')}`;
      const fileName = `senatla-payroll-${periodKey}${this.includeFullIds() ? '-full' : '-masked'}.csv`;
      downloadTextFile(csv, fileName, 'text/csv;charset=utf-8');
      await this.service.recordPayrollExport(periodKey, this.includeFullIds(), fileName);
      await this.service.setPayrollPeriodStatus(this.month(), this.year(), 'exported');
      this.feedback.set(`Payroll exported: ${fileName}`);
    });
  }

  exportTimesheetRegister() {
    const fileName = `senatla-timesheet-${this.timesheetDate()}.csv`;
    downloadTextFile(this.timesheetRegister.toCsv(this.timesheetRows()), fileName, 'text/csv;charset=utf-8');
    this.feedback.set(`Timesheet register exported: ${fileName}`);
  }

  async approveRequest(requestId: string) {
    await this.runAction(async () => {
      await this.service.approveRequest(requestId);
      this.feedback.set('Approval processed.');
    });
  }

  async rejectRequest(requestId: string) {
    await this.runAction(async () => {
      await this.service.rejectRequest(requestId);
      this.feedback.set('Approval rejected.');
    });
  }

  async retryOutboxEvent(eventId: string) {
    await this.runAction(async () => {
      await this.service.retryOutboxEvent(eventId);
      this.feedback.set('Retry requested. Monitor this audit reference for the next result.');
    });
  }

  async saveView() {
    await this.runAction(async () => {
      await this.service.saveCurrentView(this.viewName, {
        tab: this.activeTab(),
        searchTerm: this.searchTerm(),
        siteId: this.selectedSiteId(),
      });
      this.feedback.set('View saved.');
      this.viewName = '';
    });
  }

  applyView(viewId: string) {
    const view = this.service.savedViews().find((entry) => entry.id === viewId);
    if (!view) return;
    this.activeTab.set((view.filters.tab as AdminTab) || 'overview');
    this.searchTerm.set(view.filters.searchTerm || '');
    this.selectedSiteId.set(view.filters.siteId || '');
    this.feedback.set(`Applied view: ${view.name}`);
  }

  async lockPayroll() {
    await this.runAction(async () => {
      await this.service.setPayrollPeriodStatus(this.month(), this.year(), 'locked');
      this.feedback.set('Payroll period locked.');
    });
  }

  editEmployee(employee: Employee) {
    this.personForm = { ...employee, employmentStatus: employee.employmentStatus || 'active' };
    this.selectedEmployeeId.set(employee.id);
    this.showEmployeeForm.set(true);
    this.activeTab.set('people');
  }

  selectEmployee(employeeId: string) {
    this.selectedEmployeeId.set(employeeId);
    this.showEmployeeForm.set(false);
  }

  createEmployeeProfile() {
    this.resetEmployeeForm();
    this.showEmployeeForm.set(true);
    this.feedback.set(this.service.activeSites().length ? '' : 'Create at least one site before creating an employee profile.');
  }

  editSite(site: Site) {
    this.siteForm = { ...site, complianceChecklist: site.complianceChecklist || [] };
    this.siteComplianceText = (site.complianceChecklist || []).join(', ');
    this.activeTab.set('sites');
  }

  editIssue(issue: Issue) {
    this.issueForm = {
      ...issue,
      severity: issue.severity || 'medium',
      ownerProfileId: issue.ownerProfileId ?? null,
      dueAt: issue.dueAt ?? null,
    };
    this.activeTab.set('issues');
  }

  selectTab(id: string) {
    if (this.tabs.some((tab) => tab.id === id)) this.activeTab.set(id as AdminTab);
  }

  getPayroll(employeeId: string) {
    return this.service.calculateMonthlyPayroll(employeeId, this.month(), this.year());
  }

  private parseChecklist(value: string) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  private async runAction(action: () => Promise<void>) {
    this.busy.set(true);
    this.feedback.set('');
    this.resetLink.set('');
    try {
      await action();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      this.busy.set(false);
    }
  }

  private resetEmployeeForm() {
    this.personForm = {
      id: '',
      firstName: '',
      surname: '',
      idNumber: '',
      role: 'General Worker',
      siteId: this.service.activeSites()[0]?.id || '',
      startDate: new Date().toISOString().slice(0, 10),
      basicRate: 0,
      salaryAdvances: 0,
      financials: { travel: 0, housing: 0, advance: 0 },
      logs: {},
      adjustments: {},
      employmentStatus: 'active',
    };
  }
}
