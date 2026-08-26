import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Component, inject, computed, signal } from '@angular/core';
import { StaffDataService } from 'src/app/core/services/staff-data.service';
import { OfficeAdminService } from 'src/app/core/services/office-admin.service';

@Component({
  selector: 'app-director',
  templateUrl: './director.component.html',
  styleUrls: ['./director.component.scss'],
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
})
export class DirectorComponent {
  service = inject(StaffDataService);
  office = inject(OfficeAdminService);
  viewMode = signal<'day' | 'month' | 'year'>('day');

  private readonly periodSyncs = computed(() => this.service.syncHistory().filter((entry) => this.isInSelectedPeriod(entry.syncTime)));

  complianceScore = computed(() => {
    const history = this.periodSyncs();
    if (history.length === 0) return 0;
    const onTime = history.filter((entry) => entry.status === 'On Time').length;
    return (onTime / history.length) * 100;
  });

  presentCount = computed(() => {
    const today = this.toDateKey(this.service.currentTime());
    return this.service.employees().filter((employee) => employee.logs[today]?.status === 'present').length;
  });

  absentCount = computed(() => {
    const today = this.toDateKey(this.service.currentTime());
    return this.service.employees().filter((employee) => employee.logs[today]?.status === 'absent').length;
  });

  ppeExpense = computed(() => this.office.ppeIssues()
    .filter((entry) => this.isDateKeyInSelectedPeriod((entry.orderDate || entry.requestedAt).slice(0, 10)))
    .reduce((total, entry) => total + entry.unitCost, 0));

  fuelExpense = computed(() => this.office.assetFuelEntries()
    .filter((entry) => this.isDateKeyInSelectedPeriod(entry.fuelDate))
    .reduce((total, entry) => total + entry.totalCost, 0));

  vendorPayables = computed(() => this.office.vendorAccounts()
    .reduce((total, vendor) => total + vendor.totalOwingAmount, 0));

  pendingVendorInvoices = computed(() => this.office.vendorInvoices().filter((invoice) => invoice.status === 'pending_director'));
  recentVendorInvoices = computed(() => this.office.vendorInvoices().slice(0, 8));

  vendorName(vendorId: string) {
    return this.office.vendorAccounts().find((vendor) => vendor.id === vendorId)?.name || 'Unknown vendor';
  }

  siteStats = computed(() => this.service.sites().map((site) => ({
    name: site.name,
    location: site.location,
    staffCount: this.service.employees().filter((employee) => employee.siteId === site.id).length,
  })));

  recentSyncs = computed(() => this.service.syncHistory().slice(0, 5));
  highestRiskSync = computed(() => this.service.syncHistory().find((entry) => entry.status !== 'On Time') || null);

  private isInSelectedPeriod(value: Date) {
    return this.isDateKeyInSelectedPeriod(this.toDateKey(new Date(value)));
  }

  private isDateKeyInSelectedPeriod(dateKey: string) {
    const currentKey = this.toDateKey(this.service.currentTime());
    if (this.viewMode() === 'day') return dateKey === currentKey;
    if (this.viewMode() === 'month') return dateKey.startsWith(currentKey.slice(0, 7));
    return dateKey.startsWith(currentKey.slice(0, 4));
  }

  private toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
