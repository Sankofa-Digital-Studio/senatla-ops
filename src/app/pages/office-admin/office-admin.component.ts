import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TimesheetSummaryComponent } from '../../components/timesheet-summary.component';
import { UiButtonComponent } from '../../components/ui-button.component';
import { UiFeedbackComponent } from '../../components/ui-feedback.component';
import { UiTabNavComponent } from '../../components/ui-tab-nav.component';
import {
  Employee,
  EmploymentStatus,
  FinancialType,
  Issue,
  IssueSeverity,
  ManagedUserProfile,
  Site,
} from '../../core/models/app.models';
import { UserInviteInput } from '../../core/models/office-admin.models';
import { OfficeAdminService } from '../../core/services/office-admin.service';
import { TimesheetRegisterService } from '../../core/services/timesheet-register.service';
import { downloadTextFile } from '../../core/utils/browser-file.util';

type AdminTab = 'overview' | 'users' | 'people' | 'timesheets' | 'sites' | 'issues' | 'assets' | 'payroll' | 'approvals' | 'recovery' | 'activity';

@Component({
  selector: 'app-office-admin',
  templateUrl: './office-admin.component.html',
  styleUrls: ['./office-admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, RouterLink, TimesheetSummaryComponent, UiButtonComponent, UiFeedbackComponent, UiTabNavComponent],
})
export class OfficeAdminComponent {
  readonly service = inject(OfficeAdminService);
  private readonly timesheetRegister = inject(TimesheetRegisterService);

  readonly tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'people', label: 'People' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'sites', label: 'Sites' },
    { id: 'issues', label: 'Issues' },
    { id: 'assets', label: 'Assets' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'activity', label: 'Activity' },
  ];

  readonly activeTab = signal<AdminTab>('overview');
  readonly searchTerm = signal('');
  readonly selectedSiteId = signal('');
  readonly timesheetDate = signal(this.timesheetRegister.toDateKey(new Date()));
  readonly selectedEmployeeIds = signal<string[]>([]);
  readonly bulkSiteId = signal('');
  readonly month = signal(new Date().getMonth());
  readonly year = signal(new Date().getFullYear());
  readonly includeFullIds = signal(false);
  readonly busy = signal(false);
  readonly feedback = signal('');
  readonly resetLink = signal('');
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
  financialTypeForm: FinancialType = {
    id: '',
    name: '',
    category: 'Allowance',
    isActive: true,
  };

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
      await this.service.saveSite(this.siteForm);
      this.feedback.set('Site saved.');
      this.siteForm = { id: '', name: '', location: '', managerId: undefined, isActive: true };
    });
  }

  async submitEmployee() {
    await this.runAction(async () => {
      await this.service.saveEmployee(this.personForm);
      this.feedback.set('Employee saved.');
      this.resetEmployeeForm();
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
    this.activeTab.set('people');
  }

  editSite(site: Site) {
    this.siteForm = { ...site };
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
