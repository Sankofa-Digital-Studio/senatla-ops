import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { StaffDataService } from 'src/app/core/services/staff-data.service';   
 
@Component({
  selector: 'app-time-controls',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="bg-black text-white p-2 flex justify-between items-center text-[10px] font-mono border-b border-slate-700">
      <div class="flex items-center gap-2">
        <span class="text-yellow-500 font-bold">⏱ SIMULATOR:</span>
        <span>{{ service.currentTime() | date:'HH:mm' }}</span>
        <span [ngClass]="getStatusColor()" class="px-1 rounded text-black font-bold uppercase">{{ service.timeStatus() }}</span>
      </div>
      <div class="flex gap-1">
        <button (click)="setTime(10, 0)" class="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">10:00 (Normal)</button>
        <button (click)="setTime(15, 30)" class="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">15:30 (Warn)</button>
        <button (click)="setTime(17, 10)" class="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">17:10 (Block)</button>
        <button (click)="setTime(6, 30)" class="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">06:30 (Late)</button>
        <button (click)="setTime(7, 30)" class="px-2 py-1 bg-slate-800 rounded hover:bg-slate-700">07:30 (Crit)</button>
      </div>
    </div>
  `
})
export class TimeControlsComponent {
  service = inject(StaffDataService);
  setTime(h: number, m: number) { this.service.setTime(h, m); }
  getStatusColor() {
    const s = this.service.timeStatus();
    if (s === 'normal') return 'bg-green-400';
    if (s.includes('warning')) return 'bg-yellow-400';
    if (s === 'blocked') return 'bg-red-500';
    return 'bg-orange-400';
  }
}