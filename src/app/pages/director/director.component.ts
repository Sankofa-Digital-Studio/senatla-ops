import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Component, inject, computed, signal } from '@angular/core';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

@Component({
  selector: 'app-director',
  templateUrl: './director.component.html',
  styleUrls: ['./director.component.scss'],
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
})
export class DirectorComponent  {
service = inject(StaffDataService);
 viewMode = signal<'day' | 'month' | 'year'>('day');

  // --- ANALYTICS LOGIC ---

  private readonly periodSyncs = computed(() => this.service.syncHistory().filter((entry) => this.isInSelectedPeriod(entry.syncTime)));

  // 1. Compliance Score - persisted synchronization records only.
  complianceScore = computed(() => {
    const history = this.periodSyncs();
    if (history.length === 0) return 0;
    const onTime = history.filter((entry) => entry.status === 'On Time').length;
    return (onTime / history.length) * 100;
  });

  // 2. Headcount
  presentCount = computed(() => {
    const today = this.toDateKey(this.service.currentTime());
    return this.service.employees().filter(e => e.logs[today]?.status === 'present').length;
  });

  absentCount = computed(() => {
    const today = this.toDateKey(this.service.currentTime());
    return this.service.employees().filter(e => e.logs[today]?.status === 'absent').length;
  });

  // 3. Financials
  // "Actual" is based on who is PRESENT today
  actualDailyCost = computed(() => {
    const today = this.toDateKey(this.service.currentTime());
    return this.service.employees().reduce((acc, emp) => {
       const isPresent = emp.logs[today]?.status === 'present';
       return acc + (isPresent ? emp.basicRate : 0);
    }, 0);
  });

  // Actual cost from recorded attendance. No synthetic multipliers.
  displayedCost = computed(() => {
     return this.service.employees().reduce((total, employee) => total + Object.entries(employee.logs)
       .filter(([dateKey, log]) => log.status === 'present' && this.isDateKeyInSelectedPeriod(dateKey))
       .reduce((employeeTotal) => employeeTotal + employee.basicRate, 0), 0);
  });

  // 4. Per-Site Breakdown
  siteStats = computed(() => {
     return this.service.sites().map(site => {
        const staff = this.service.employees().filter(e => e.siteId === site.id);
        const displayCost = staff.reduce((total, employee) => total + Object.entries(employee.logs)
          .filter(([dateKey, log]) => log.status === 'present' && this.isDateKeyInSelectedPeriod(dateKey))
          .reduce((employeeTotal) => employeeTotal + employee.basicRate, 0), 0);

        return {
           name: site.name,
           location: site.location,
           staffCount: staff.length,
           dailyCost: displayCost
        };
     });
  });

  // 5. Recent Activity
  recentSyncs = computed(() => this.service.syncHistory().slice(0, 5));
  highestRiskSync = computed(() => this.service.syncHistory().find((entry) => entry.status !== 'On Time') || null);

  // 6. Persisted attendance cost trend.
  trendData = computed(() => {
     const totals = new Map<string, number>();
     for (const employee of this.service.employees()) {
       for (const [dateKey, log] of Object.entries(employee.logs)) {
         if (log.status !== 'present' || !this.isDateKeyInSelectedPeriod(dateKey)) continue;
         const bucket = this.viewMode() === 'year' ? dateKey.slice(0, 7) : dateKey;
         totals.set(bucket, (totals.get(bucket) || 0) + employee.basicRate);
       }
     }
     const entries = [...totals.entries()].sort(([left], [right]) => left.localeCompare(right));
     const max = Math.max(0, ...entries.map(([, value]) => value));
     return entries.map(([label, value]) => ({ label, value, ratio: max ? (value / max) * 100 : 0 }));
  });

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

