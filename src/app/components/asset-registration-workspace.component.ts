import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AssetEvidenceType,
  AssetRegistrationDraft,
  AssetRegistrationEvidence,
  AssetReminderMilestone,
  Site,
  VehicleAsset,
} from '../core/models/app.models';
import { AssetFormComponent } from './asset-form.component';
import { UiButtonComponent } from './ui-button.component';
import { UiFeedbackComponent } from './ui-feedback.component';

export interface AssetEvidenceFileSelection {
  file: File;
  evidenceType: AssetEvidenceType;
}

@Component({
  selector: 'app-asset-registration-workspace',
  standalone: true,
  imports: [CommonModule, AssetFormComponent, UiButtonComponent, UiFeedbackComponent],
  template: `
    <div class="workflow">
      <section class="registration-status" *ngIf="draft">
        <div><span></span><strong>{{ stateLabel(draft.state) }}</strong><small>Owned by {{ draft.ownerName }}</small></div>
        <app-ui-button size="sm" variant="secondary" [busy]="busy" (pressed)="draftSaveRequested.emit()">Save draft</app-ui-button>
      </section>

      <section class="capture-workspace">
        <header><h3>Capture and scan</h3><p>Use the rear camera for readable, full-frame evidence. Detected values require review.</p></header>
        <div class="capture-grid">
          <button *ngFor="let option of captureOptions" type="button" [disabled]="busy" (click)="captureRequested.emit(option.type)">
            <span>{{ option.symbol }}</span><strong>{{ option.label }}</strong><small>{{ option.detail }}</small>
          </button>
        </div>
        <div class="document-grid">
          <label *ngFor="let option of documentOptions"><strong>{{ option.label }}</strong><span>PDF or image</span><input type="file" accept="application/pdf,image/*" [disabled]="busy" (change)="selectFile($event, option.type)"></label>
        </div>
      </section>

      <section class="evidence-review" *ngIf="evidence.length">
        <header><h3>Evidence and extraction review</h3><p>{{ evidence.length }} file(s) tied to this registration.</p></header>
        <div class="evidence-list">
          <article *ngFor="let item of evidence">
            <img *ngIf="item.previewUrl" [src]="item.previewUrl" [alt]="evidenceLabel(item.evidenceType)">
            <div><strong>{{ evidenceLabel(item.evidenceType) }}</strong><small>{{ item.fileName }}</small><span [class.needs-review]="item.extractionState === 'review_required'">{{ extractionLabel(item) }}</span></div>
            <app-ui-button *ngIf="item.extractionState === 'review_required'" size="sm" variant="secondary" [busy]="busy" (pressed)="extractionRequested.emit(item)">Apply values</app-ui-button>
          </article>
        </div>
      </section>

      <app-ui-feedback *ngIf="message" [message]="message" tone="warning"></app-ui-feedback>
      <app-asset-form [asset]="asset" [sites]="sites" [busy]="busy" [message]="error" submitLabel="Complete registration" (save)="completionRequested.emit()"></app-asset-form>

      <section class="reminder-preview" *ngIf="reminders.length">
        <header><h3>Licence reminder schedule</h3><p>Device notifications cover renewal and the 30-day grace window.</p></header>
        <ol><li *ngFor="let item of reminders"><span>{{ dateLabel(item.scheduledAt) }}</span><strong>{{ item.title }}</strong><small>{{ item.phase === 'expiry' ? 'Renewal' : 'Grace period' }}</small></li></ol>
      </section>
    </div>
  `,
  styles: [`
    .workflow { display: grid; gap: 14px; }
    .registration-status { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #33404d; border-radius: 6px; background: #151d25; }
    .registration-status>div { display: grid; grid-template-columns: 8px auto; align-items: center; gap: 2px 8px; }
    .registration-status>div>span { width: 8px; height: 8px; border-radius: 50%; background: #f4c542; }
    .registration-status small { grid-column: 2; color: #8e9aa7; }
    .capture-workspace,.evidence-review,.reminder-preview { padding: 16px; border: 1px solid #2d3945; border-radius: 6px; background: #10171e; }
    header h3 { margin: 0; color: #f2f5f8; font-size: 14px; }
    header p { margin: 4px 0 0; color: #8f9dab; font-size: 12px; line-height: 1.5; }
    .capture-grid,.document-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 14px; }
    .capture-grid button { display: grid; min-height: 104px; place-items: center; align-content: center; gap: 5px; padding: 12px; border: 1px solid #3b4855; border-radius: 6px; background: #18222c; color: #f5f7f9; font: inherit; cursor: pointer; }
    .capture-grid button:hover:not(:disabled) { border-color: #e0b93c; background: #1d2833; }
    .capture-grid button:disabled,.document-grid input:disabled { cursor: not-allowed; opacity: .5; }
    .capture-grid button>span { color: #f0c746; font: 800 10px ui-monospace, monospace; }
    .capture-grid small,.document-grid label span,.document-grid input { color: #8998a6; font-size: 10px; }
    .document-grid { margin-top: 10px; }
    .document-grid label { display: grid; gap: 3px; padding: 10px; border: 1px dashed #465463; border-radius: 6px; color: #dfe5ea; cursor: pointer; }
    .document-grid input { width: 100%; margin-top: 5px; }
    .evidence-list { display: grid; gap: 8px; margin-top: 12px; }
    .evidence-list article { display: grid; grid-template-columns: 56px 1fr auto; align-items: center; gap: 10px; min-height: 58px; padding: 7px; border-bottom: 1px solid #293541; }
    .evidence-list img { width: 56px; height: 48px; border-radius: 4px; object-fit: cover; }
    .evidence-list article>div { display: grid; gap: 2px; }
    .evidence-list small,.evidence-list span { color: #8795a3; font-size: 10px; }
    .evidence-list .needs-review { color: #f0c746; }
    ol { display: grid; margin: 12px 0 0; padding: 0; list-style: none; }
    li { display: grid; grid-template-columns: 92px 1fr auto; gap: 10px; padding: 8px 0; border-bottom: 1px solid #293541; color: #dce3e8; font-size: 11px; }
    li span,li small { color: #8493a1; }
    @media (max-width:760px) { .capture-grid,.document-grid { grid-template-columns:1fr; } .capture-grid button { min-height:82px; } .registration-status { position:sticky; top:0; z-index:4; } .evidence-list article { grid-template-columns:48px 1fr; } .evidence-list img { width:48px; } .evidence-list app-ui-button { grid-column:1/-1; } li { grid-template-columns:82px 1fr; } li small { grid-column:2; } }
  `],
})
export class AssetRegistrationWorkspaceComponent {
  readonly captureOptions: Array<{ type: AssetEvidenceType; symbol: string; label: string; detail: string }> = [
    { type: 'asset_photo', symbol: 'CAM', label: 'Asset photo', detail: 'Overall condition and identity' },
    { type: 'number_plate', symbol: 'SCAN', label: 'Number plate', detail: 'Detect supported encoded data' },
    { type: 'licence_disc', symbol: 'SCAN', label: 'Licence disc', detail: 'Capture disc and expiry evidence' },
  ];
  readonly documentOptions: Array<{ type: AssetEvidenceType; label: string }> = [
    { type: 'registration_document', label: 'Registration document' },
    { type: 'purchase_invoice', label: 'Purchase invoice' },
    { type: 'other', label: 'Other evidence' },
  ];

  @Input({ required: true }) asset!: VehicleAsset;
  @Input() sites: Site[] = [];
  @Input() draft: AssetRegistrationDraft | null = null;
  @Input() evidence: AssetRegistrationEvidence[] = [];
  @Input() reminders: AssetReminderMilestone[] = [];
  @Input() busy = false;
  @Input() message = '';
  @Input() error = '';
  @Output() readonly draftSaveRequested = new EventEmitter<void>();
  @Output() readonly captureRequested = new EventEmitter<AssetEvidenceType>();
  @Output() readonly fileSelected = new EventEmitter<AssetEvidenceFileSelection>();
  @Output() readonly extractionRequested = new EventEmitter<AssetRegistrationEvidence>();
  @Output() readonly completionRequested = new EventEmitter<void>();

  stateLabel(state: AssetRegistrationDraft['state']) {
    return { draft: 'Draft', review_required: 'Review required', ready: 'Ready to register', completed: 'Completed' }[state];
  }

  evidenceLabel(type: AssetEvidenceType) {
    return { asset_photo: 'Asset photo', number_plate: 'Number plate', licence_disc: 'Licence disc', registration_document: 'Registration document', purchase_invoice: 'Purchase invoice', other: 'Other evidence' }[type];
  }

  extractionLabel(evidence: AssetRegistrationEvidence) {
    if (evidence.extractionState === 'review_required') return 'Values detected - review required';
    if (evidence.extractionState === 'pending') return 'Saved for manual review';
    return 'Attached';
  }

  dateLabel(date: Date) {
    return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  selectFile(event: Event, evidenceType: AssetEvidenceType) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit({ file, evidenceType });
    input.value = '';
  }
}
