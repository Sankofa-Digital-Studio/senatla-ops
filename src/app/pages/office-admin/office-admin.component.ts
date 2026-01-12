import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { StaffDataService } from '../../core/services/staff-data.service';
import { Employee, Site, Issue } from '../../core/models/app.models';
import { FormsModule } from '@angular/forms';
type TabId = 'dashboard' | 'workforce' | 'sites' | 'payroll' | 'issues';

@Component({
  selector: 'app-office-admin',
  templateUrl: './office-admin.component.html',
  styleUrls: ['./office-admin.component.scss'],
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule],
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
    { id: 'issues', label: 'Resolution Centre' }
  ];

  // Helper method to set active tab safely with strict typing
  setActiveTab(id: TabId) {
    this.activeTab.set(id);
  }

  // Payroll Filters
  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Workforce State
  searchTerm = signal('');
  filterSiteId = signal('');
  showEmpModal = false;
  isEditMode = false;
  tempEmp: Partial<Employee> = {};

  // Site Management State
  showSiteModal = false;
  isSiteEditMode = false;
  tempSite: Partial<Site> = { name: '', location: '' };

   showAdjustmentModal = false;
  adjustmentEmpId: string | null = null;
  adjustmentEmpName = '';
sortBy = signal<'surname' | 'firstName'>('surname');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Financials Modal State
  showFinancialsModal = false;


  // Computed Stats
  openIssuesCount = computed(() => this.service.issues().filter(i => i.status === 'Open').length);

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
     this.tempEmp = { ...emp }; // Clone for editing
     this.showFinancialsModal = true;
  }

  saveFinancials() {
     if (this.tempEmp.id) {
        // Use existing update logic from service
        this.service.updateEmployee(this.tempEmp.id, this.tempEmp);
     }
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
    this.showSiteModal = true;
  }

  openEditSiteModal(site: Site) {
    this.isSiteEditMode = true;
    this.tempSite = { ...site }; // Clone to avoid direct mutation before save
    this.showSiteModal = true;
  }

  saveSite() {
    if (this.tempSite.name && this.tempSite.location) {
      if (this.isSiteEditMode && this.tempSite.id) {
        this.service.updateSite(this.tempSite.id, this.tempSite);
      } else {
        // @ts-ignore - simplified type casting
        this.service.addSite(this.tempSite as any);
      }
      this.showSiteModal = false;
    }
  }

  // Employee CRUD
  resetEmpForm() {
    this.tempEmp = { 
       firstName: '', surname: '', idNumber: '', basicRate: 0, 
       travelAllowance: 0, housingAllowance: 0, startDate: new Date().toISOString().split('T')[0] 
    };
  }

  editEmployee(emp: Employee) {
    this.isEditMode = true;
    this.tempEmp = { ...emp }; // Clone
    this.showEmpModal = true;
  }

  saveEmployee() {
    if (this.isEditMode && this.tempEmp.id) {
       this.service.updateEmployee(this.tempEmp.id, this.tempEmp);
    } else {
       // @ts-ignore - simplified for demo, rigorous validation needed in prod
       this.service.addEmployee(this.tempEmp as Employee);
    }
    this.showEmpModal = false;
  }

  deleteEmployee(id: string) {
    if(confirm('Are you sure you want to remove this employee record?')) {
       this.service.deleteEmployee(id);
    }
  }

  // Export
  exportCSV() {
    const csvData = this.service.generateCSV(this.selectedMonth, this.selectedYear);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Senatla_Payroll_${this.months[this.selectedMonth]}_${this.selectedYear}.csv`;
    a.click();
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

  
  
}