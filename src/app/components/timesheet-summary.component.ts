import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TimesheetRegisterSummary } from '../core/models/timesheet.models';

@Component({
  selector: 'app-timesheet-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="summary" [class.summary--compact]="compact" aria-label="Timesheet completion summary">
      <div *ngFor="let metric of metrics()" [attr.data-tone]="metric.tone">
        <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong>
      </div>
    </section>
  `,
  styles: [`
    .summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #303a45; border-radius: 6px; background: #303a45; }
    .summary div { min-width: 0; padding: 11px 12px; background: #11171d; }
    .summary span { display: block; color: #8693a0; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .summary strong { display: block; margin-top: 4px; color: #e8edf2; font-size: 18px; line-height: 1; }
    [data-tone='accent'] strong { color: #f5c84c; }
    [data-tone='success'] strong { color: #6ee7a0; }
    [data-tone='danger'] strong { color: #fca5a5; }
    [data-tone='warning'] strong { color: #fdba74; }
    .summary--compact div { padding: 8px; }
    .summary--compact strong { font-size: 16px; }
    @media (max-width: 680px) { .summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  `],
})
export class TimesheetSummaryComponent {
  @Input({ required: true }) summary!: TimesheetRegisterSummary;
  @Input() compact = false;

  metrics() {
    return [
      { label: 'Complete', value: `${this.summary.completionPercent}%`, tone: 'accent' },
      { label: 'Workers', value: this.summary.total, tone: 'neutral' },
      { label: 'Present', value: this.summary.present, tone: 'success' },
      { label: 'Absent', value: this.summary.absent, tone: 'danger' },
      { label: 'Pending', value: this.summary.pending, tone: 'neutral' },
      { label: 'Flagged', value: this.summary.flagged, tone: 'warning' },
    ];
  }
}
