import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Employee,
  Group,
  SyncRecord,
  DailyLog,
  Site,
  Issue,
  SafetyTalkRecord,
  FinancialType
} from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class StaffDataService {
  private readonly storageKey = 'senatla_ops_data';

  currentTime = signal<Date>(new Date());
  siteName = signal<string>('Senatla Shaft 1');
  lastSyncTime = signal<Date | null>(null);
  unsyncedChanges = signal<boolean>(false);

  safetyTalkCompleted = signal<boolean>(false);
  currentSafetyTopic = signal<string | null>(null);
  safetyTalks = signal<SafetyTalkRecord[]>([]);

  currentSafetyTalk = computed(() => {
    const today = this.currentTime().toDateString();
    return this.safetyTalks().find((talk) => talk.date.toDateString() === today) || null;
  });

  safetyTopics = signal<string[]>([]);
  syncHistory = signal<SyncRecord[]>([]);
  sites = signal<Site[]>([]);
  issues = signal<Issue[]>([]);
  groups = signal<Group[]>([]);
  financialTypes = signal<FinancialType[]>([]);

  private employeeState = signal<Employee[]>([]);

  readonly employees = this.employeeState.asReadonly();
  readonly activeSites = computed(() => this.sites().filter((site) => site.isActive));
  readonly activeFinancialTypes = computed(() => this.financialTypes().filter((type) => type.isActive));

  constructor() {
    this.loadFromStorage();

    effect(() => {
      this.saveToStorage();
    });
  }

  private loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      this.initializeDefaults();
      return;
    }

    try {
      const parsed = JSON.parse(data);
      this.siteName.set(this.cleanText(parsed.siteName) || 'Senatla Shaft 1');
      this.sites.set(Array.isArray(parsed.sites) ? parsed.sites.map((site: any) => this.normalizeSite(site)) : []);
      this.employeeState.set(
        Array.isArray(parsed.employees)
          ? parsed.employees.map((employee: any) => this.normalizeEmployee(employee))
          : [],
      );
      this.issues.set(parsed.issues || []);
      this.groups.set(
        Array.isArray(parsed.groups)
          ? parsed.groups
              .map((group: any) => ({ id: this.generateId(group.id), name: this.cleanText(group.name) }))
              .filter((group: Group) => Boolean(group.name))
          : [],
      );
      this.financialTypes.set(parsed.financialTypes || []);
      this.safetyTopics.set(
        Array.isArray(parsed.safetyTopics)
          ? parsed.safetyTopics.map((topic: any) => this.cleanText(topic)).filter(Boolean)
          : [],
      );
      this.syncHistory.set(parsed.syncHistory || []);

      if (parsed.lastSyncTime) this.lastSyncTime.set(new Date(parsed.lastSyncTime));
      if (parsed.safetyTalks) {
        this.safetyTalks.set(parsed.safetyTalks.map((talk: any) => ({ ...talk, date: new Date(talk.date) })));
        const today = this.currentTime().toDateString();
        const hasTalkToday = parsed.safetyTalks.some((talk: any) => new Date(talk.date).toDateString() === today);
        this.safetyTalkCompleted.set(hasTalkToday);
        if (hasTalkToday) {
          const talk = parsed.safetyTalks.find((item: any) => new Date(item.date).toDateString() === today);
          this.currentSafetyTopic.set(talk?.topic || null);
        }
      }
    } catch {
      localStorage.removeItem(this.storageKey);
      this.initializeDefaults();
    }
  }

  private saveToStorage() {
    const data = {
      siteName: this.siteName(),
      sites: this.sites(),
      employees: this.employeeState(),
      issues: this.issues(),
      groups: this.groups(),
      financialTypes: this.financialTypes(),
      safetyTopics: this.safetyTopics(),
      syncHistory: this.syncHistory(),
      lastSyncTime: this.lastSyncTime(),
      safetyTalks: this.safetyTalks()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private initializeDefaults() {
    this.sites.set([
      { id: 's1', name: 'Senatla Shaft 1', location: 'Welkom', isActive: true },
      { id: 's2', name: 'Harmony Plant B', location: 'Virginia', isActive: true }
    ]);
    this.groups.set([{ id: 'g1', name: 'Team Alpha' }, { id: 'g2', name: 'Drill Squad' }]);
    this.financialTypes.set([
      { id: 'travel', name: 'Travel Allowance', category: 'Allowance', isActive: true, isSystem: true },
      { id: 'housing', name: 'Housing Allowance', category: 'Allowance', isActive: true, isSystem: true },
      { id: 'advance', name: 'Salary Advance', category: 'Deduction', isActive: true, isSystem: true },
      { id: 'loan', name: 'Company Loan', category: 'Deduction', isActive: true, isSystem: false }
    ]);
    this.safetyTopics.set(['Heat Stress & Dehydration', 'Falls of Ground (FOG)', 'Machinery Safety', 'PPE Compliance', 'Emergency Evacuation']);
    this.employeeState.set([
      { id: '1', firstName: 'Tshepo', surname: 'Mokoena', idNumber: '9001015800080', role: 'General Worker', siteId: 's1', groupId: 'g1', startDate: '2023-01-10', basicRate: 350, salaryAdvances: 0, financials: { travel: 0, housing: 0, advance: 0 }, logs: this.generateMockLogs(), adjustments: {} },
      { id: '2', firstName: 'Johannes', surname: 'Zulu', idNumber: '8805205800080', role: 'Safety Rep', siteId: 's1', groupId: 'g1', startDate: '2022-05-15', basicRate: 450, salaryAdvances: 0, financials: { travel: 50, housing: 0, advance: 0 }, logs: this.generateMockLogs(), adjustments: {} },
      { id: '3', firstName: 'David', surname: 'Botha', idNumber: '8508125800080', role: 'Operator', siteId: 's1', groupId: 'g2', startDate: '2021-11-01', basicRate: 600, salaryAdvances: 500, financials: { travel: 100, housing: 0, advance: 500 }, logs: this.generateMockLogs(), adjustments: {} },
      { id: '4', firstName: 'Samuel', surname: 'Nkosi', idNumber: '9502285800080', role: 'General Worker', siteId: 's1', groupId: undefined, startDate: '2023-06-01', basicRate: 350, salaryAdvances: 0, financials: { travel: 0, housing: 0, advance: 0 }, logs: this.generateMockLogs(), adjustments: {} },
      { id: '5', firstName: 'Michael', surname: 'Khumalo', idNumber: '8207155800080', role: 'Driver', siteId: 's1', groupId: 'g2', startDate: '2020-03-10', basicRate: 550, salaryAdvances: 0, financials: { travel: 0, housing: 0, advance: 0 }, logs: this.generateMockLogs(), adjustments: {} }
    ]);
  }

  setTime(hour: number, minute: number) { const d = new Date(); d.setHours(hour, minute, 0, 0); this.currentTime.set(d); }

  completeSafetyTalk(topic: string) {
    const newRecord: SafetyTalkRecord = {
      id: this.generateId(),
      date: new Date(this.currentTime()),
      topic,
      notes: '',
      photoUrl: ''
    };
    this.safetyTalks.update((talks) => [newRecord, ...talks]);
    this.currentSafetyTopic.set(topic);
    this.safetyTalkCompleted.set(true);
  }

  updateSafetyTalkDetails(id: string, notes: string, photoUrl: string) {
    this.safetyTalks.update((talks) => talks.map((talk) => {
      if (talk.id === id) return { ...talk, notes: this.cleanText(notes).slice(0, 500), photoUrl: this.cleanText(photoUrl) };
      return talk;
    }));
  }

  addSafetyTopic(topic: string) {
    const value = this.cleanText(topic);
    if (!value || this.safetyTopics().includes(value)) return;
    this.safetyTopics.update((current) => [...current, value]);
  }
  removeSafetyTopic(topic: string) { this.safetyTopics.update((current) => current.filter((entry) => entry !== topic)); }
  updateSafetyTopic(oldTopic: string, newTopic: string) { if (!newTopic.trim()) return; this.safetyTopics.update((current) => current.map((entry) => entry === oldTopic ? newTopic.trim() : entry)); if (this.currentSafetyTopic() === oldTopic) this.currentSafetyTopic.set(newTopic.trim()); }

  addFinancialType(name: string, category: 'Allowance' | 'Deduction') {
    const normalizedName = this.cleanText(name);
    if (!normalizedName) return;
    const newType: FinancialType = { id: this.generateId(), name: normalizedName, category, isActive: true, isSystem: false };
    this.financialTypes.update((types) => [...types, newType]);
  }
  toggleFinancialType(id: string) { this.financialTypes.update((types) => types.map((type) => { if (type.id === id && !type.isSystem) return { ...type, isActive: !type.isActive }; return type; })); }
  deleteFinancialType(id: string) { this.financialTypes.update((types) => types.filter((type) => type.id !== id || type.isSystem)); }

  addSite(site: Omit<Site, 'id' | 'isActive'>) {
    const newSite = this.normalizeSite({ ...site, id: this.generateId(), isActive: true });
    this.sites.update((current) => [...current, newSite]);
  }
  updateSite(id: string, updates: Partial<Site>) { this.sites.update((current) => current.map((site) => site.id === id ? this.normalizeSite({ ...site, ...updates, id }) : site)); }
  deleteSite(id: string) { this.sites.update((current) => current.map((site) => site.id === id ? { ...site, isActive: false } : site)); }

  addEmployee(emp: Omit<Employee, 'id' | 'logs' | 'adjustments'>) {
    const newEmp = this.normalizeEmployee({ ...emp, id: this.generateId(), logs: {}, adjustments: {} });
    this.employeeState.update((current) => [...current, newEmp]);
  }
  updateEmployee(id: string, updates: Partial<Employee>) { this.employeeState.update((current) => current.map((emp) => emp.id === id ? this.normalizeEmployee({ ...emp, ...updates, id }) : emp)); }
  deleteEmployee(id: string) { this.employeeState.update((current) => current.filter((emp) => emp.id !== id)); }

  addGroup(name: string) {
    const groupName = this.cleanText(name);
    if (!groupName) return;
    const newGroup: Group = { id: this.generateId(), name: groupName };
    this.groups.update((current) => [...current, newGroup]);
  }
  assignGroup(empId: string, groupId: string | undefined) { this.employeeState.update((employees) => employees.map((employee) => employee.id === empId ? { ...employee, groupId } : employee)); }

  resolveIssue(id: string, note: string) { this.updateIssueStatus(id, 'Resolved', note); }
  escalateIssue(id: string, note: string) { this.updateIssueStatus(id, 'Escalated', note); }
  private updateIssueStatus(id: string, status: 'Resolved' | 'Escalated', note: string) { this.issues.update((issues) => issues.map((issue) => { if (issue.id !== id) return issue; return { ...issue, status, auditTrail: [...issue.auditTrail, { date: new Date(this.currentTime()), action: this.cleanText(note) || status, user: 'Office Admin' }] }; })); }

  setManualAdjustment(empId: string, month: number, year: number, week: number, days: number) {
    const key = `${year}-${month}-${week}`;
    const safeDays = this.clampNumber(days, 0, 31);
    this.employeeState.update((employees) => employees.map((employee) => {
      if (employee.id !== empId) return employee;
      return { ...employee, adjustments: { ...employee.adjustments, [key]: safeDays } };
    }));
  }
  getManualAdjustment(empId: string, month: number, year: number, week: number): number { const emp = this.employeeState().find((employee) => employee.id === empId); if (!emp) return 0; const key = `${year}-${month}-${week}`; return emp.adjustments[key] || 0; }

  readonly timeStatus = computed(() => {
    const now = this.currentTime();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 15 || (hours === 15 && minutes < 30)) return 'normal';
    if ((hours === 15 && minutes >= 30) || hours === 16) return 'warning_1';
    if (hours === 17 && minutes <= 5) return 'warning_2';
    if (hours >= 17 || hours < 6) return 'blocked';
    if (hours === 6) return 'late_window';
    if (hours >= 7 && hours < 9) return 'critical_late';
    return 'normal';
  });

  calculateMonthlyPayroll(empId: string, month: number, year: number) {
    const emp = this.employeeState().find((employee) => employee.id === empId); if (!emp) return null;

    let automatedDays = 0;
    Object.values(emp.logs).forEach((log) => {
      const date = new Date(log.date);
      if (date.getMonth() === month && date.getFullYear() === year && log.status === 'present') {
        automatedDays++;
      }
    });

    let adjustmentDays = 0;
    for (let week = 1; week <= 5; week++) {
      adjustmentDays += (emp.adjustments[`${year}-${month}-${week}`] || 0);
    }

    const totalDays = Math.max(0, automatedDays + adjustmentDays);
    const grossWages = totalDays * emp.basicRate;

    let totalAllowances = 0;
    let totalDeductions = 0;

    this.financialTypes().forEach((type) => {
      if (!type.isActive) return;
      const amount = emp.financials[type.id] || 0;
      if (type.category === 'Allowance') totalAllowances += amount;
      if (type.category === 'Deduction') totalDeductions += amount;
    });

    const advance = emp.salaryAdvances || 0;
    const uifDeduction = (grossWages + totalAllowances) * 0.01;
    const totalEarnings = grossWages + totalAllowances;
    const netPay = totalEarnings - uifDeduction - totalDeductions - advance;

    return { daysWorked: totalDays, automatedDays, adjustmentDays, grossWages, allowances: totalAllowances, deductions: totalDeductions, salaryAdvances: advance, uifDeduction, totalEarnings, netPay };
  }

  generateCSV(month: number, year: number): string {
    const header = 'ID Number,Surname,First Name,Site,Days Worked,Manual Adj,Basic Rate,Gross Wage,Allowances,Deductions,Advances,UIF Deduction,Net Pay\n';
    const rows = this.employeeState().map((emp) => {
      const payroll = this.calculateMonthlyPayroll(emp.id, month, year);
      if (!payroll) return '';
      const siteName = this.sites().find((site) => site.id === emp.siteId)?.name || 'Unknown';
      return `${emp.idNumber},${emp.surname},${emp.firstName},${siteName},${payroll.daysWorked},${payroll.adjustmentDays},${emp.basicRate},${payroll.grossWages},${payroll.allowances},${payroll.deductions},${payroll.salaryAdvances},${payroll.uifDeduction.toFixed(2)},${payroll.netPay.toFixed(2)}`;
    }).join('\n');
    return header + rows;
  }

  performSync(signature: string, isRolloverAck: boolean = false) {
    const status = this.determineSyncStatus();
    this.syncHistory.update((history) => [
      {
        siteId: this.siteName(),
        syncTime: this.currentTime(),
        status,
        acknowledgedWarning: isRolloverAck,
        signatureData: signature,
        safetyTopic: this.currentSafetyTopic() || 'None Recorded'
      },
      ...history
    ]);
    this.lastSyncTime.set(this.currentTime());
    this.unsyncedChanges.set(false);
  }

  private determineSyncStatus(): 'On Time' | 'Late' | 'Critical' | 'Rollover' {
    const status = this.timeStatus();
    if (status === 'late_window') return 'Late';
    if (status === 'critical_late') return 'Critical';
    if (status === 'normal' || status === 'warning_1' || status === 'warning_2') return 'On Time';
    return 'Rollover';
  }

  setSiteName(name: string) { this.siteName.set(this.cleanText(name).slice(0, 80) || 'Senatla Shaft 1'); }
  updateStatus(empId: string, dateStr: string, newStatus: 'present' | 'absent', evidence?: DailyLog['evidence']) {
    this.unsyncedChanges.set(true);
    const todayStr = this.getTodayStr();
    if (dateStr > todayStr) return;
    const isRetroactive = dateStr < todayStr;

    this.employeeState.update((employees) => employees.map((employee) => {
      if (employee.id !== empId) return employee;
      const oldLog = employee.logs[dateStr] || { date: dateStr, status: 'pending' };
      if (oldLog.status === newStatus) return employee;

      const updatedLog: DailyLog = {
        ...oldLog,
        status: newStatus,
        reason: newStatus === 'present' ? null : 'Sick',
        evidence: newStatus === 'present' ? evidence ?? oldLog.evidence ?? null : null,
        isFlagged: isRetroactive ? true : oldLog.isFlagged,
        lastUpdated: new Date(this.currentTime()),
      };
      return { ...employee, logs: { ...employee.logs, [dateStr]: updatedLog } };
    }));
  }

  updateReason(empId: string, dateStr: string, reason: DailyLog['reason']) {
    this.unsyncedChanges.set(true);
    this.employeeState.update((employees) => employees.map((employee) => {
      if (employee.id !== empId) return employee;
      const log = employee.logs[dateStr];
      if (!log) return employee;
      return { ...employee, logs: { ...employee.logs, [dateStr]: { ...log, reason } } };
    }));
  }
  updateComment(empId: string, dateStr: string, comment: string) {
    this.unsyncedChanges.set(true);
    this.employeeState.update((employees) => employees.map((employee) => {
      if (employee.id !== empId) return employee;
      const log = employee.logs[dateStr] || { date: dateStr, status: 'pending' };
      return { ...employee, logs: { ...employee.logs, [dateStr]: { ...log, comment: this.cleanText(comment).slice(0, 280) } } };
    }));
  }

  private getTodayStr(): string {
    const current = this.currentTime();
    const year = current.getFullYear();
    const month = `${current.getMonth() + 1}`.padStart(2, '0');
    const day = `${current.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  private generateMockLogs(): Record<string, DailyLog> { const today = this.getTodayStr(); return { [today]: { date: today, status: 'present' } }; }
  private cleanText(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
  private clampNumber(value: unknown, min: number, max: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  }
  private generateId(seed?: string): string {
    const value = this.cleanText(seed);
    return value || Math.random().toString(36).slice(2, 11);
  }
  private normalizeSite(site: Partial<Site>): Site {
    return {
      id: this.generateId(site.id),
      name: this.cleanText(site.name) || 'Unnamed Site',
      location: this.cleanText(site.location) || 'Unknown',
      managerId: this.cleanText(site.managerId) || undefined,
      isActive: site.isActive ?? true,
    };
  }
  private normalizeEmployee(employee: Partial<Employee>): Employee {
    const financials = { ...(employee.financials || {}) };
    const travel = this.clampNumber(financials['travel'] ?? employee.travelAllowance ?? 0, 0, 1_000_000);
    const housing = this.clampNumber(financials['housing'] ?? employee.housingAllowance ?? 0, 0, 1_000_000);
    const advance = this.clampNumber(financials['advance'] ?? 0, 0, 1_000_000);

    return {
      id: this.generateId(employee.id),
      firstName: this.cleanText(employee.firstName) || 'Unknown',
      surname: this.cleanText(employee.surname) || 'Employee',
      idNumber: this.cleanText(employee.idNumber),
      role: employee.role || 'General Worker',
      siteId: this.cleanText(employee.siteId),
      groupId: this.cleanText(employee.groupId) || undefined,
      startDate: this.cleanText(employee.startDate) || this.getTodayStr(),
      basicRate: this.clampNumber(employee.basicRate, 0, 1_000_000),
      salaryAdvances: this.clampNumber(employee.salaryAdvances, 0, 1_000_000),
      financials: {
        ...financials,
        travel,
        housing,
        advance,
      },
      logs: employee.logs || {},
      adjustments: employee.adjustments || {},
      travelAllowance: travel,
      housingAllowance: housing,
      taxRefNumber: this.cleanText(employee.taxRefNumber) || undefined,
    };
  }
}


