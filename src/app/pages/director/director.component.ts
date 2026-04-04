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

  // 1. Compliance Score
  complianceScore = computed(() => {
    const history = this.service.syncHistory();
    if (history.length === 0) return 100;
    const onTime = history.filter(h => h.status === 'On Time').length;
    // Simulate slight variance for demo realism
    if (this.viewMode() === 'month') return 92; 
    if (this.viewMode() === 'year') return 88;
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

  // Dynamic Cost Display
  displayedCost = computed(() => {
     const daily = this.actualDailyCost();
     if (this.viewMode() === 'day') return daily;
     if (this.viewMode() === 'month') return daily * 22; // Projected Month (22 shifts)
     return daily * 264; // Projected Year (12 * 22 shifts)
  });

  // 4. Per-Site Breakdown
  siteStats = computed(() => {
     return this.service.sites().map(site => {
        const staff = this.service.employees().filter(e => e.siteId === site.id);
        const dailyCost = staff.reduce((acc, e) => acc + e.basicRate, 0); // Potential daily burn
        
        let displayCost = dailyCost;
        if (this.viewMode() === 'month') displayCost *= 22;
        if (this.viewMode() === 'year') displayCost *= 264;

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

  // 6. Simulated Trend Data (for Graph)
  trendData = computed(() => {
     if (this.viewMode() === 'year') {
        return [45, 50, 48, 52, 55, 58, 54, 60, 62, 59, 65, 70]; // Monthly growth
     } else {
        return [10, 40, 30, 50, 40, 60, 50, 70, 60, 80, 70, 90, 80, 100]; // Daily fluctuations
     }
  });

  private toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

