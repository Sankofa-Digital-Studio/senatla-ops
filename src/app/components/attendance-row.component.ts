import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyLog, Employee } from '../core/models/app.models';

export interface AttendanceStatusChange {
  employee: Employee;
  status: DailyLog['status'];
}

export interface AttendanceReasonChange {
  employeeId: string;
  reason: NonNullable<DailyLog['reason']>;
}

export interface AttendanceCommentChange {
  employeeId: string;
  comment: string;
}

@Component({
  selector: 'app-attendance-row',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <article class="attendance-row" [attr.data-status]="log.status">
      <span *ngIf="log.isFlagged" class="flag">Flagged</span>
      <header>
        <div class="identity">
          <h3>{{ employee.firstName }} {{ employee.surname }}</h3>
          <p><span>{{ employee.role }}</span><span *ngIf="groupName">{{ groupName }}</span></p>
        </div>
        <div class="status-control" aria-label="Attendance status">
          <button *ngFor="let status of statuses" type="button" [class.active]="log.status === status" [attr.data-status]="status" [disabled]="disabled" (click)="statusChange.emit({ employee: employee, status: status })">{{ status }}</button>
        </div>
      </header>

      <div *ngIf="log.evidence?.capturedAt" class="evidence">
        Verified at {{ log.evidence.capturedAt | date:'shortTime' }}<span *ngIf="log.evidence.location"> / GPS attached</span>
      </div>

      <section *ngIf="log.status !== 'pending'" class="details">
        <div *ngIf="log.status === 'absent'" class="reason-control">
          <span>Reason</span>
          <div>
            <button *ngFor="let reason of reasons" type="button" [class.active]="log.reason === reason" [disabled]="disabled" (click)="reasonChange.emit({ employeeId: employee.id, reason: reason })">{{ reason }}</button>
          </div>
        </div>
        <label>Daily comment
          <input type="text" [ngModel]="log.comment || ''" (ngModelChange)="commentChange.emit({ employeeId: employee.id, comment: $event })" [disabled]="disabled" placeholder="Add note">
        </label>
      </section>
    </article>
  `,
  styles: [`
    .attendance-row { position: relative; padding: 14px; border: 1px solid #38424d; border-left: 4px solid #596572; border-radius: 6px; background: #1b232c; color: #fff; }
    .attendance-row[data-status='present'] { border-left-color: #22c55e; }
    .attendance-row[data-status='absent'] { border-left-color: #ef4444; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    h3 { margin: 0; font-size: 14px; }
    .identity p { display: flex; flex-wrap: wrap; gap: 6px; margin: 5px 0 0; }
    .identity p span { padding: 2px 5px; border-radius: 3px; background: #11171d; color: #aeb8c2; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .flag { position: absolute; top: 7px; right: 8px; color: #fdba74; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .status-control { display: grid; grid-template-columns: repeat(3, minmax(62px, 1fr)); overflow: hidden; border: 1px solid #52606d; border-radius: 5px; }
    .status-control button { min-height: 34px; border: 0; border-right: 1px solid #52606d; background: transparent; color: #b5c0ca; font: inherit; font-size: 9px; font-weight: 700; text-transform: uppercase; cursor: pointer; }
    .status-control button:last-child { border-right: 0; }
    .status-control button[data-status='present'].active { background: #166534; color: #fff; }
    .status-control button[data-status='absent'].active { background: #991b1b; color: #fff; }
    .status-control button[data-status='pending'].active { background: #4b5563; color: #fff; }
    button:disabled, input:disabled { cursor: not-allowed; opacity: .45; }
    button:focus-visible, input:focus-visible { outline: 2px solid #f5a800; outline-offset: -2px; }
    .evidence { margin-top: 10px; padding: 7px 9px; border: 1px solid #166534; border-radius: 4px; background: #102a1b; color: #bbf7d0; font-size: 10px; }
    .details { display: grid; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #37424d; }
    .reason-control > span, label { color: #9aa7b3; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .reason-control div { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .reason-control button { min-height: 30px; border: 1px solid #53606d; border-radius: 4px; background: transparent; color: #ccd4dc; padding: 5px 8px; font: inherit; font-size: 9px; cursor: pointer; }
    .reason-control button.active { border-color: #f5a800; background: #33270c; color: #fde68a; }
    label { display: grid; gap: 5px; }
    input { min-height: 34px; border: 0; border-bottom: 1px solid #52606d; background: transparent; color: #fff; font: inherit; font-size: 12px; text-transform: none; }
    @media (max-width: 640px) { header { align-items: stretch; flex-direction: column; } .status-control { width: 100%; } .status-control button { min-height: 42px; } }
  `],
})
export class AttendanceRowComponent {
  readonly statuses: DailyLog['status'][] = ['present', 'absent', 'pending'];
  @Input({ required: true }) employee!: Employee;
  @Input({ required: true }) log!: DailyLog;
  @Input() groupName = '';
  @Input() disabled = false;
  @Input() reasons: Array<NonNullable<DailyLog['reason']>> = [];
  @Output() readonly statusChange = new EventEmitter<AttendanceStatusChange>();
  @Output() readonly reasonChange = new EventEmitter<AttendanceReasonChange>();
  @Output() readonly commentChange = new EventEmitter<AttendanceCommentChange>();
}
