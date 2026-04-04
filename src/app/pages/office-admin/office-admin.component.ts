import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { StaffDataService } from '../../core/services/staff-data.service';
import { Employee, Site } from '../../core/models/app.models';
import { FormsModule } from '@angular/forms';
import { AssetRegisterComponent } from '../asset-register/asset-register.component';

type TabId = 'dashboard' | 'workforce' | 'sites' | 'payroll' | 'issues' | 'assets';
type EmployeeForm = Partial<Employee> & {
  travelAllowance?: number;
  housingAllowance?: number;
  salaryAdvances?: number;
};

@Component({
  selector: 'app-office-admin',
  templateUrl: './office-admin.component.html',
  styleUrls: ['./office-admin.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule, AssetRegisterComponent],
})
export class OfficeAdminComponent  {
  service = inject(StaffDataService);
  
  activeTab = signal<TabId>('dashboard');
  
  // Explicitly typing the tabs array to match TabId
  tabs: { id: TabId, label: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'workforce', label: 'Workforce' },
    { id: 'sites', label: 'Sites' },
    { id: 'payroll', label: 'Payroll & Time' },
    { id: 'issues', label: 'Resolution Centre' },
    { id: 'assets', label: 'Assets' }
  ];

  readonly roleOptions: Employee['role'][] = ['General Worker', 'Safety Rep', 'Operator', 'Driver', 'Foreman'];
  readonly defaultFinancials: Record<string, number> = { travel: 0, housing: 0, advance: 0, loan: 0 };

  // Helper method to set active tab safely with strict typing
  setActiveTab(id: TabId) {
    this.activeTab.set(id);
  }

  // Payroll Filters
  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  showFullIdNumbers = signal(false);

  // Workforce State
  searchTerm = signal('');
  filterSiteId = signal('');
  showEmpModal = false;
  isEditMode = false;
  tempEmp: EmployeeForm = {};
  employeeFormError = '';

  // Site Management State
  showSiteModal = false;
  isSiteEditMode = false;
  tempSite: Partial<Site> = { name: '', location: '' };
  siteFormError = '';

   showAdjustmentModal = false;
  adjustmentEmpId: string | null = null;
  adjustmentEmpName = '';
sortBy = signal<'surname' | 'firstName'>('surname');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Financials Modal State
  showFinancialsModal = false;
  showExportModal = false;
  exportFullIdNumbers = false;
  exportConfirmationText = '';
  exportError = '';


  // Computed Stats
  openIssuesCount = computed(() => this.service.issues().filter(i => i.status === 'Open').length);
  financialTypeFields = computed(() => this.service.activeFinancialTypes().filter(type => type.id !== 'advance'));

 // Updated Filter Logic with Sort
  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const site = this.filterSiteId();
    const employees = this.service.employees().filter(e => {
      const nameMatch = (e.firstName.toLowerCase().includes(term) || e.surname.toLowerCase().includes(term));
      const idMatch = e.idNumber.includes(term);
      const siteMatch = site ? e.siteId === site : true;
      return (nameMatch || idMatch) && siteMatch;
    });
    
    // Sort logic
    return employees.sort((a, b) => {
       const fieldA = a[this.sortBy()].toLowerCase();
       const fieldB = b[this.sortBy()].toLowerCase();
       if (fieldA < fieldB) return this.sortDir() === 'asc' ? -1 : 1;
       if (fieldA > fieldB) return this.sortDir() === 'asc' ? 1 : -1;
       return 0;
    });
  });

  // ... existing helpers ...

  // Sorting Toggle
  toggleSort(field: 'surname' | 'firstName') {
     if (this.sortBy() === field) {
        this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
     } else {
        this.sortBy.set(field);
        this.sortDir.set('asc');
     }
  }

  // Financials Modal Actions
  openFinancialsModal(emp: Employee) {
     this.tempEmp = {
        ...emp,
        financials: { ...this.defaultFinancials, ...emp.financials },
        salaryAdvances: emp.salaryAdvances ?? 0
     };
     this.showFinancialsModal = true;
     this.employeeFormError = '';
  }

  saveFinancials() {
     const payload = this.buildEmployeePayload(true);
     if (!payload || !payload.id) return;
     this.service.updateEmployee(payload.id, payload);
     this.showFinancialsModal = false;
  }

  // --- HELPERS ---
  getSiteName(id: string) {
    return this.service.sites().find(s => s.id === id)?.name || 'Unassigned';
  }

  getPayroll(empId: string) {
    return this.service.calculateMonthlyPayroll(empId, this.selectedMonth, this.selectedYear);
  }

  // --- ACTIONS ---
  
  // Sites
  openAddSiteModal() {
    this.isSiteEditMode = false;
    this.tempSite = { name: '', location: '' };
    this.siteFormError = '';
    this.showSiteModal = true;
  }

  openEditSiteModal(site: Site) {
    this.isSiteEditMode = true;
    this.tempSite = { ...site }; // Clone to avoid direct mutation before save
    this.siteFormError = '';
    this.showSiteModal = true;
  }

  saveSite() {
    const name = this.tempSite.name?.trim() || '';
    const location = this.tempSite.location?.trim() || '';
    if (!name || !location) {
      this.siteFormError = 'Site name and location are required.';
      return;
    }

    const duplicate = this.service.sites().some(site =>
      site.name.trim().toLowerCase() === name.toLowerCase() &&
      site.id !== this.tempSite.id
    );
    if (duplicate) {
      this.siteFormError = 'A site with this name already exists.';
      return;
    }

    const payload: Site = {
      id: this.tempSite.id || this.createId(),
      name,
      location,
      managerId: this.tempSite.managerId,
      isActive: this.tempSite.isActive ?? true
    };

    if (this.isSiteEditMode && this.tempSite.id) {
      this.service.updateSite(this.tempSite.id, payload);
    } else {
      this.service.addSite({
        name,
        location,
        managerId: this.tempSite.managerId
      });
    }

    this.showSiteModal = false;
    this.siteFormError = '';
  }

  // Employee CRUD
  resetEmpForm() {
    this.tempEmp = { 
       firstName: '', surname: '', idNumber: '', basicRate: 0,
       role: 'General Worker', siteId: this.service.activeSites()[0]?.id || this.service.sites()[0]?.id || '',
       groupId: undefined,
       salaryAdvances: 0,
       financials: { ...this.defaultFinancials },
       startDate: new Date().toISOString().split('T')[0]
    };
    this.employeeFormError = '';
  }

  editEmployee(emp: Employee) {
    this.isEditMode = true;
    this.tempEmp = {
      ...emp,
      financials: { ...this.defaultFinancials, ...emp.financials },
      salaryAdvances: emp.salaryAdvances ?? 0
    }; // Clone
    this.employeeFormError = '';
    this.showEmpModal = true;
  }

  saveEmployee() {
    const payload = this.buildEmployeePayload(false);
    if (!payload) return;

    if (this.isEditMode && payload.id) {
       this.service.updateEmployee(payload.id, payload);
    } else {
       this.service.addEmployee(payload);
    }
    this.showEmpModal = false;
    this.employeeFormError = '';
  }

  deleteEmployee(id: string) {
    if(confirm('Are you sure you want to remove this employee record?')) {
       this.service.deleteEmployee(id);
    }
  }

  // Export
  openExportModal() {
    this.showExportModal = true;
    this.exportFullIdNumbers = false;
    this.exportConfirmationText = '';
    this.exportError = '';
  }

  exportCSV() {
    if (this.exportFullIdNumbers && this.exportConfirmationText.trim().toUpperCase() !== 'EXPORT') {
      this.exportError = 'Type EXPORT to unlock a full-ID payroll export.';
      return;
    }

    const csvData = this.service.generateCSV(this.selectedMonth, this.selectedYear, {
      includeFullIdNumbers: this.exportFullIdNumbers
    });
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sensitivitySuffix = this.exportFullIdNumbers ? 'full-ids' : 'masked-ids';
    a.download = `Senatla_Payroll_${this.months[this.selectedMonth]}_${this.selectedYear}_${sensitivitySuffix}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showExportModal = false;
    this.exportError = '';
  }

  openAdjustmentModal(emp: Employee) {
    this.adjustmentEmpId = emp.id;
    this.adjustmentEmpName = `${emp.firstName} ${emp.surname}`;
    this.showAdjustmentModal = true;
  }

  getAdjustmentValue(week: number) {
    if (!this.adjustmentEmpId) return 0;
    return this.service.getManualAdjustment(this.adjustmentEmpId, this.selectedMonth, this.selectedYear, week);
  }

  updateAdjustment(week: number, change: number) {
    if (!this.adjustmentEmpId) return;
    const current = this.getAdjustmentValue(week);
    const newValue = current + change;
    this.service.setManualAdjustment(this.adjustmentEmpId, this.selectedMonth, this.selectedYear, week, newValue);
  }

  setAdjustment(week: number, value: number) {
    if (!this.adjustmentEmpId) return;
    this.service.setManualAdjustment(this.adjustmentEmpId, this.selectedMonth, this.selectedYear, week, value);
  }

    getWeekLabel(week: number): string {
    const startDay = (week - 1) * 7 + 1;
    const startDate = new Date(this.selectedYear, this.selectedMonth, startDay);
    
    // If week starts in next month, it's invalid
    if (startDate.getMonth() !== this.selectedMonth) return '';

    const lastDayOfMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
    const endDay = Math.min(week * 7, lastDayOfMonth);
    const endDate = new Date(this.selectedYear, this.selectedMonth, endDay);

    const startFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFmt = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `Week ${week} (${startFmt} - ${endFmt})`;
  }

  private buildEmployeePayload(isFinancialEdit: boolean): Employee | null {
    const firstName = this.cleanText(this.tempEmp.firstName);
    const surname = this.cleanText(this.tempEmp.surname);
    const idNumber = this.cleanText(this.tempEmp.idNumber);
    const siteId = this.cleanText(this.tempEmp.siteId);
    const startDate = this.cleanText(this.tempEmp.startDate) || new Date().toISOString().split('T')[0];
    const role = this.tempEmp.role;
    const basicRate = Number(this.tempEmp.basicRate ?? 0);
    const salaryAdvances = Number(this.tempEmp.salaryAdvances ?? 0);
    const travelAllowance = Number(this.tempEmp.financials?.['travel'] ?? this.tempEmp.travelAllowance ?? 0);
    const housingAllowance = Number(this.tempEmp.financials?.['housing'] ?? this.tempEmp.housingAllowance ?? 0);

    if (!firstName || !surname) {
      this.employeeFormError = 'First name and surname are required.';
      return null;
    }
    if (!/^\d{13}$/.test(idNumber)) {
      this.employeeFormError = 'ID number must be 13 digits.';
      return null;
    }
    if (!Number.isFinite(basicRate) || basicRate <= 0) {
      this.employeeFormError = 'Basic rate must be a positive number.';
      return null;
    }
    if (!siteId || !this.service.sites().some(site => site.id === siteId && site.isActive)) {
      this.employeeFormError = 'Select an active site before saving.';
      return null;
    }
    if (!this.roleOptions.includes(role as Employee['role'])) {
      this.employeeFormError = 'Select a valid role.';
      return null;
    }
    if (!isFinancialEdit) {
      const duplicateId = this.service.employees().some(emp => emp.idNumber === idNumber && emp.id !== this.tempEmp.id);
      if (duplicateId) {
        this.employeeFormError = 'An employee with this ID number already exists.';
        return null;
      }
    }

    const existing = this.tempEmp.id
      ? this.service.employees().find(emp => emp.id === this.tempEmp.id)
      : undefined;

    const financials = {
      ...this.defaultFinancials,
      ...(existing?.financials || {}),
      ...(this.tempEmp.financials || {}),
      travel: travelAllowance,
      housing: housingAllowance
    };

    return {
      id: this.tempEmp.id || this.createId(),
      firstName,
      surname,
      idNumber,
      role: role || 'General Worker',
      siteId,
      groupId: this.tempEmp.groupId,
      startDate,
      basicRate,
      salaryAdvances,
      financials: Object.entries(financials).reduce<Record<string, number>>((acc, [key, value]) => {
        acc[key] = Number.isFinite(Number(value)) ? Number(value) : 0;
        return acc;
      }, {}),
      logs: existing?.logs || this.tempEmp.logs || {},
      adjustments: existing?.adjustments || this.tempEmp.adjustments || {},
      travelAllowance,
      housingAllowance,
      taxRefNumber: this.cleanText(this.tempEmp.taxRefNumber) || undefined
    };
  }

  private cleanText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  getIdNumberDisplay(idNumber: string): string {
    return this.showFullIdNumbers() ? idNumber : this.service.maskIdNumber(idNumber);
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 11);
  }

  
  
}

