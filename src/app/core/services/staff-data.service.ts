import { Injectable, signal, computed } from '@angular/core';
import { Employee, Group, SyncRecord, DailyLog, Site, Issue } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class StaffDataService {
  
   // --- TIME SIMULATION STATE ---
  currentTime = signal<Date>(new Date());
  
  // --- CORE STATE ---
  siteName = signal<string>('Senatla Shaft 1');
  lastSyncTime = signal<Date | null>(null);
  unsyncedChanges = signal<boolean>(false);
  
  // Safety Gatekeeper State
  safetyTalkCompleted = signal<boolean>(false);
  currentSafetyTopic = signal<string | null>(null);
  
  safetyTopics = signal<string[]>([
    "Heat Stress & Dehydration",
    "Falls of Ground (FOG)",
    "Machinery Safety",
    "PPE Compliance",
    "Emergency Evacuation"
  ]);

  syncHistory = signal<SyncRecord[]>([]);

  // --- NEW: SITES STATE ---
  sites = signal<Site[]>([
    { id: 's1', name: 'Senatla Shaft 1', location: 'Welkom', isActive: true },
    { id: 's2', name: 'Harmony Plant B', location: 'Virginia', isActive: true }
  ]);

  // --- NEW: ISSUES STATE ---
  issues = signal<Issue[]>([
    { 
      id: 'i1', siteId: 's1', reportedBy: 'Site Mgr', dateReported: new Date(), 
      category: 'Discipline', description: 'Worker refused PPE protocol.', 
      status: 'Open', auditTrail: [] 
    }
  ]);

  groups = signal<Group[]>([
    { id: 'g1', name: 'Team Alpha' }, 
    { id: 'g2', name: 'Drill Squad' }
  ]);
  
  // --- UPDATED: EMPLOYEE STATE (With Financials) ---
  private employeeState = signal<Employee[]>([
    { 
      id: '1', firstName: 'Tshepo', surname: 'Mokoena', idNumber: '9001015800080',
      role: 'General Worker', siteId: 's1', groupId: 'g1',
      startDate: '2023-01-10', basicRate: 350, travelAllowance: 0, housingAllowance: 0,
      logs: this.generateMockLogs() 
    },
    { 
      id: '2', firstName: 'Johannes', surname: 'Zulu', idNumber: '8805205800080',
      role: 'Safety Rep', siteId: 's1', groupId: 'g1',
      startDate: '2022-05-15', basicRate: 450, travelAllowance: 50, housingAllowance: 0,
      logs: this.generateMockLogs() 
    },
    { 
      id: '3', firstName: 'David', surname: 'Botha', idNumber: '8508125800080',
      role: 'Operator', siteId: 's1', groupId: 'g2',
      startDate: '2021-11-01', basicRate: 600, travelAllowance: 100, housingAllowance: 0,
      logs: this.generateMockLogs() 
    },
    { 
      id: '4', firstName: 'Samuel', surname: 'Nkosi', idNumber: '9502285800080',
      role: 'General Worker', siteId: 's1', groupId: undefined,
      startDate: '2023-06-01', basicRate: 350, travelAllowance: 0, housingAllowance: 0,
      logs: this.generateMockLogs() 
    },
    { 
      id: '5', firstName: 'Michael', surname: 'Khumalo', idNumber: '8207155800080',
      role: 'Driver', siteId: 's1', groupId: 'g2',
      startDate: '2020-03-10', basicRate: 550, travelAllowance: 0, housingAllowance: 0,
      logs: this.generateMockLogs() 
    }
  ]);

  readonly employees = this.employeeState.asReadonly();
  readonly activeSites = computed(() => this.sites().filter(s => s.isActive));

  // --- TIME GOVERNANCE LOGIC ---
  readonly timeStatus = computed(() => {
    const now = this.currentTime();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 15 || (hours === 15 && minutes < 30)) return 'normal';
    if ((hours === 15 && minutes >= 30) || (hours === 16)) return 'warning_1';
    if (hours === 17 && minutes <= 5) return 'warning_2';
    if (hours >= 17 || hours < 6) return 'blocked';
    if (hours === 6) return 'late_window';
    if (hours >= 7 && hours < 9) return 'critical_late';
    return 'normal';
  });

  setTime(hour: number, minute: number) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    this.currentTime.set(d);
  }

  // --- SAFETY ACTIONS ---
  completeSafetyTalk(topic: string) {
    this.currentSafetyTopic.set(topic);
    this.safetyTalkCompleted.set(true);
  }

  addSafetyTopic(topic: string) {
    if (!topic.trim()) return;
    this.safetyTopics.update(current => [...current, topic.trim()]);
  }

  removeSafetyTopic(topic: string) {
    this.safetyTopics.update(current => current.filter(t => t !== topic));
  }

  updateSafetyTopic(oldTopic: string, newTopic: string) {
    if (!newTopic.trim()) return;
    this.safetyTopics.update(current => current.map(t => t === oldTopic ? newTopic.trim() : t));
    if (this.currentSafetyTopic() === oldTopic) {
      this.currentSafetyTopic.set(newTopic.trim());
    }
  }

  // --- SITE MANAGEMENT ACTIONS ---
  addSite(site: Omit<Site, 'id' | 'isActive'>) {
    const newSite: Site = { ...site, id: crypto.randomUUID(), isActive: true };
    this.sites.update(s => [...s, newSite]);
  }

  updateSite(id: string, updates: Partial<Site>) {
    this.sites.update(s => s.map(site => site.id === id ? { ...site, ...updates } : site));
  }

  deleteSite(id: string) {
    this.sites.update(s => s.map(site => site.id === id ? { ...site, isActive: false } : site));
  }

  // --- WORKFORCE MANAGEMENT ACTIONS ---
  addEmployee(emp: Omit<Employee, 'id' | 'logs'>) {
    const newEmp: Employee = { 
      ...emp, 
      id: crypto.randomUUID(), 
      logs: {} 
    };
    this.employeeState.update(e => [...e, newEmp]);
  }

  updateEmployee(id: string, updates: Partial<Employee>) {
    this.employeeState.update(e => e.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  }

  deleteEmployee(id: string) {
    this.employeeState.update(e => e.filter(emp => emp.id !== id));
  }

  // --- ISSUE RESOLUTION ACTIONS ---
  resolveIssue(id: string, note: string) {
    this.updateIssueStatus(id, 'Resolved', note);
  }

  escalateIssue(id: string, note: string) {
    this.updateIssueStatus(id, 'Escalated', note);
  }

  private updateIssueStatus(id: string, status: 'Resolved' | 'Escalated', note: string) {
    this.issues.update(issues => issues.map(i => {
      if (i.id !== id) return i;
      return {
        ...i,
        status: status,
        auditTrail: [...i.auditTrail, { date: new Date(), action: status, user: 'Office Admin' }]
      };
    }));
  }

  // --- PAYROLL & EXPORT LOGIC ---
  calculateMonthlyPayroll(empId: string, month: number, year: number) {
    const emp = this.employeeState().find(e => e.id === empId);
    if (!emp) return null;

    let daysWorked = 0;
    Object.values(emp.logs).forEach(log => {
      const d = new Date(log.date);
      if (d.getMonth() === month && d.getFullYear() === year && log.status === 'present') {
        daysWorked++;
      }
    });

    const grossWages = daysWorked * emp.basicRate;
    const allowances = (emp.travelAllowance || 0) + (emp.housingAllowance || 0);
    const uifDeduction = (grossWages + allowances) * 0.01; // 1% UIF
    const totalEarnings = grossWages + allowances;
    
    return { daysWorked, grossWages, allowances, uifDeduction, totalEarnings };
  }

  generateCSV(month: number, year: number): string {
    const header = "ID Number,Surname,First Name,Site,Days Worked,Basic Rate,Gross Wage,Allowances,UIF Deduction,Net Pay\n";
    const rows = this.employeeState().map(emp => {
      const payroll = this.calculateMonthlyPayroll(emp.id, month, year);
      if (!payroll) return '';
      const net = payroll.totalEarnings - payroll.uifDeduction;
      const siteName = this.sites().find(s => s.id === emp.siteId)?.name || 'Unknown';
      return `${emp.idNumber},${emp.surname},${emp.firstName},${siteName},${payroll.daysWorked},${emp.basicRate},${payroll.grossWages},${payroll.allowances},${payroll.uifDeduction.toFixed(2)},${net.toFixed(2)}`;
    }).join("\n");
    return header + rows;
  }

  // --- SYNC & ATTENDANCE ACTIONS ---
  performSync(signature: string, isRolloverAck: boolean = false) {
    const status = this.determineSyncStatus();
    this.syncHistory.update(h => [
      {
        siteId: this.siteName(),
        syncTime: this.currentTime(),
        status: status,
        acknowledgedWarning: isRolloverAck,
        signatureData: signature,
        safetyTopic: this.currentSafetyTopic() || 'None Recorded'
      },
      ...h
    ]);
    this.lastSyncTime.set(this.currentTime());
    this.unsyncedChanges.set(false);
  }

  private determineSyncStatus(): 'On Time' | 'Late' | 'Critical' | 'Rollover' {
    const s = this.timeStatus();
    if (s === 'late_window') return 'Late';
    if (s === 'critical_late') return 'Critical';
    if (s === 'normal' || s === 'warning_1' || s === 'warning_2') return 'On Time';
    return 'Rollover'; 
  }

  setSiteName(name: string) { this.siteName.set(name); }

  addGroup(name: string) {
    const newGroup: Group = { id: Math.random().toString(36).substr(2, 9), name };
    this.groups.update(g => [...g, newGroup]);
  }

  assignGroup(empId: string, groupId: string | undefined) {
    this.employeeState.update(emps => emps.map(e => e.id === empId ? { ...e, groupId } : e));
  }

  updateStatus(empId: string, dateStr: string, newStatus: 'present' | 'absent') {
    this.unsyncedChanges.set(true);
    const todayStr = this.getTodayStr();
    if (dateStr > todayStr) return; 
    const isRetroactive = dateStr < todayStr;

    this.employeeState.update(emps => emps.map(emp => {
      if (emp.id !== empId) return emp;
      const oldLog = emp.logs[dateStr] || { date: dateStr, status: 'pending' };
      if (oldLog.status === newStatus) return emp;

      const updatedLog: DailyLog = {
        ...oldLog,
        status: newStatus,
        reason: newStatus === 'present' ? null : 'Sick', 
        isFlagged: isRetroactive ? true : oldLog.isFlagged,
        lastUpdated: new Date()
      };
      return { ...emp, logs: { ...emp.logs, [dateStr]: updatedLog } };
    }));
  }

  updateReason(empId: string, dateStr: string, reason: any) {
    this.unsyncedChanges.set(true);
    this.employeeState.update(emps => emps.map(e => {
      if (e.id !== empId) return e;
      const log = e.logs[dateStr];
      if (!log) return e;
      return { ...e, logs: { ...e.logs, [dateStr]: { ...log, reason } } };
    }));
  }

  updateComment(empId: string, dateStr: string, comment: string) {
    this.unsyncedChanges.set(true);
    this.employeeState.update(emps => emps.map(e => {
      if (e.id !== empId) return e;
      const log = e.logs[dateStr] || { date: dateStr, status: 'pending' };
      return { ...e, logs: { ...e.logs, [dateStr]: { ...log, comment } } };
    }));
  }

  readonly totalAbsent = computed(() => {
    const today = this.getTodayStr();
    return this.employeeState().filter(e => e.logs[today]?.status === 'absent').length;
  });

  readonly totalPayroll = computed(() => {
    const today = this.getTodayStr();
    return this.employeeState().reduce((acc, emp) => {
      const isPresent = emp.logs[today]?.status === 'present';
      return acc + (isPresent ? emp.basicRate : 0);
    }, 0);
  });

  private getTodayStr(): string { return new Date().toISOString().split('T')[0]; }

  private generateMockLogs(): Record<string, DailyLog> {
    const today = this.getTodayStr();
    return { [today]: { date: today, status: 'present' } };
  }
  }