import { Injectable, signal, computed } from '@angular/core';
import { Employee, Group, SyncRecord, DailyLog } from '../models/app.models';

@Injectable({ providedIn: 'root' })
export class StaffDataService {
  
  // --- TIME SIMULATION STATE ---
  // In production, this would be replaced by new Date() checks or server time
  currentTime = signal<Date>(new Date());
  
  // --- CORE STATE ---
  siteName = signal<string>('Senatla Shaft 1');
  lastSyncTime = signal<Date | null>(null);
  unsyncedChanges = signal<boolean>(false);
  
  // Safety Gatekeeper State
  safetyTalkCompleted = signal<boolean>(false);
  currentSafetyTopic = signal<string | null>(null);
  
  // Dynamic Topics List - Persists in memory during session
  safetyTopics = signal<string[]>([
    "Heat Stress & Dehydration",
    "Falls of Ground (FOG)",
    "Machinery Safety",
    "PPE Compliance",
    "Emergency Evacuation"
  ]);

  // Compliance Logs for Office Admin
  syncHistory = signal<SyncRecord[]>([]);

  // Site Groups
  groups = signal<Group[]>([
    { id: 'g1', name: 'Team Alpha' }, 
    { id: 'g2', name: 'Drill Squad' }
  ]);
  
  // MAIN DATA STORE: Employees & their logs
  private employeeState = signal<Employee[]>([
    { 
      id: '1', name: 'T. Mokoena', role: 'General Worker', rate: 350, groupId: 'g1', 
      logs: this.generateMockLogs() 
    },
    { 
      id: '2', name: 'J. Zulu', role: 'Safety Rep', rate: 450, groupId: 'g1', 
      logs: this.generateMockLogs() 
    },
    { 
      id: '3', name: 'D. Botha', role: 'Operator', rate: 600, groupId: 'g2', 
      logs: this.generateMockLogs() 
    },
    { 
      id: '4', name: 'S. Nkosi', role: 'General Worker', rate: 350, groupId: undefined, 
      logs: this.generateMockLogs() 
    },
    { 
      id: '5', name: 'M. Khumalo', role: 'Driver', rate: 550, groupId: 'g2', 
      logs: this.generateMockLogs() 
    }
  ]);

  // Read-only public accessor for employees
  readonly employees = this.employeeState.asReadonly();

  // --- TIME GOVERNANCE LOGIC ---
  // This signal re-computes whenever currentTime changes
  readonly timeStatus = computed(() => {
    const now = this.currentTime();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Normal: 00:00 - 15:29
    if (hours < 15 || (hours === 15 && minutes < 30)) return 'normal';
    
    // Warning 1: 15:30 - 16:59
    if ((hours === 15 && minutes >= 30) || (hours === 16)) return 'warning_1';
    
    // Warning 2: 17:00 - 17:05 (Urgent window)
    if (hours === 17 && minutes <= 5) return 'warning_2';
    
    // Blocked: 17:06 - 05:59 (Next Day)
    if (hours >= 17 || hours < 6) return 'blocked';
    
    // Late Window: 06:00 - 07:00
    if (hours === 6) return 'late_window';
    
    // Critical Late: 07:00 - 08:00
    if (hours >= 7 && hours < 9) return 'critical_late';
    
    return 'normal';
  });

  // --- ACTIONS: TIME CONTROL (DEBUGGER) ---
  setTime(hour: number, minute: number) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    this.currentTime.set(d);
  }

  // --- ACTIONS: SAFETY & TOPICS ---
  
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
    
    // If the currently selected topic was updated, update that too so UI reflects change immediately
    if (this.currentSafetyTopic() === oldTopic) {
      this.currentSafetyTopic.set(newTopic.trim());
    }
  }

  // --- ACTIONS: SYNC & GOVERNANCE ---

  performSync(signature: string, isRolloverAck: boolean = false) {
    const status = this.determineSyncStatus();
    
    // Add new record to history
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

    // Update state
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

  // --- ACTIONS: SITE & GROUPS ---

  setSiteName(name: string) { 
    this.siteName.set(name); 
  }

  addGroup(name: string) {
    const newGroup: Group = { id: Math.random().toString(36).substr(2, 9), name };
    this.groups.update(g => [...g, newGroup]);
  }

  assignGroup(empId: string, groupId: string | undefined) {
    this.employeeState.update(emps => emps.map(e => e.id === empId ? { ...e, groupId } : e));
  }

  // --- ACTIONS: ATTENDANCE LOGIC ---

  updateStatus(empId: string, dateStr: string, newStatus: 'present' | 'absent') {
    this.unsyncedChanges.set(true); // Mark data as dirty
    
    const todayStr = this.getTodayStr();
    // Prevent future editing
    if (dateStr > todayStr) return; 
    
    const isRetroactive = dateStr < todayStr;

    this.employeeState.update(emps => emps.map(emp => {
      if (emp.id !== empId) return emp;
      
      const oldLog = emp.logs[dateStr] || { date: dateStr, status: 'pending' };
      
      // Optimization: if status hasn't changed, do nothing
      if (oldLog.status === newStatus) return emp;

      const updatedLog: DailyLog = {
        ...oldLog,
        status: newStatus,
        // Reset reason if present, default to 'Sick' if absent for quick entry
        reason: newStatus === 'present' ? null : 'Sick', 
        isFlagged: isRetroactive ? true : oldLog.isFlagged,
        lastUpdated: new Date()
      };

      // Immutable update of logs map
      return { 
        ...emp, 
        logs: { ...emp.logs, [dateStr]: updatedLog } 
      };
    }));
  }

  updateReason(empId: string, dateStr: string, reason: any) {
    this.unsyncedChanges.set(true);
    this.employeeState.update(emps => emps.map(e => {
      if (e.id !== empId) return e;
      const log = e.logs[dateStr];
      if (!log) return e;
      
      return { 
        ...e, 
        logs: { ...e.logs, [dateStr]: { ...log, reason } } 
      };
    }));
  }

  updateComment(empId: string, dateStr: string, comment: string) {
    this.unsyncedChanges.set(true);
    this.employeeState.update(emps => emps.map(e => {
      if (e.id !== empId) return e;
      const log = e.logs[dateStr] || { date: dateStr, status: 'pending' };
      
      return { 
        ...e, 
        logs: { ...e.logs, [dateStr]: { ...log, comment } } 
      };
    }));
  }

  // --- ANALYTICS (Computed Signals) ---

  readonly totalAbsent = computed(() => {
    const today = this.getTodayStr();
    return this.employeeState().filter(e => e.logs[today]?.status === 'absent').length;
  });

  readonly totalPayroll = computed(() => {
    const today = this.getTodayStr();
    return this.employeeState().reduce((acc, emp) => {
      const isPresent = emp.logs[today]?.status === 'present';
      return acc + (isPresent ? emp.rate : 0);
    }, 0);
  });

  // --- HELPERS ---

  private getTodayStr(): string { 
    return new Date().toISOString().split('T')[0]; 
  }

  private generateMockLogs(): Record<string, DailyLog> {
    const today = this.getTodayStr();
    return { 
      [today]: { date: today, status: 'present' } 
    };
  }
}