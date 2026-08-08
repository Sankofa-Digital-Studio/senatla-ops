import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Site, VehicleAsset } from '../core/models/app.models';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <h2 class="text-sm font-bold uppercase tracking-wider text-gray-400">Asset details</h2>
      <p class="mt-2 text-xs leading-5 text-gray-500">At least one identifier is required. Review every populated value before verification.</p>
      <div *ngIf="message" class="mt-4 rounded-lg border px-3 py-2 text-sm" [class.border-red-500/20]="isError" [class.bg-red-500/10]="isError" [class.text-red-200]="isError" [class.border-emerald-500/20]="!isError" [class.bg-emerald-500/10]="!isError" [class.text-emerald-200]="!isError">{{ message }}</div>
      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <label class="text-xs text-gray-400">Number plate<input [(ngModel)]="asset.registrationNumber" (ngModelChange)="changed.emit()" autocomplete="off" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">VIN<input [(ngModel)]="asset.vin" (ngModelChange)="changed.emit()" autocomplete="off" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400 md:col-span-2">Serial number<input [(ngModel)]="asset.serialNumber" (ngModelChange)="changed.emit()" autocomplete="off" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Make<input [(ngModel)]="asset.make" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Model<input [(ngModel)]="asset.model" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Asset class<input [(ngModel)]="asset.assetClass" (ngModelChange)="changed.emit()" placeholder="e.g. Excavator" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Custodian<input [(ngModel)]="asset.custodianName" (ngModelChange)="changed.emit()" placeholder="Person or team" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Operating category<select [(ngModel)]="asset.type" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"><option>Heavy Duty</option><option>Yellow Metal</option><option>Light Vehicle</option></select></label>
        <label class="text-xs text-gray-400">Status<select [(ngModel)]="asset.status" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"><option>Active</option><option>Maintenance</option><option>Expired</option></select></label>
        <label class="text-xs text-gray-400">Lifecycle<select [(ngModel)]="asset.lifecycleState" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option><option value="disposed">Disposed</option></select></label>
        <label class="text-xs text-gray-400">Compliance / licence date<input [(ngModel)]="asset.licenseExpiry" (ngModelChange)="changed.emit()" type="date" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></label>
        <label class="text-xs text-gray-400">Assigned site<select [(ngModel)]="asset.assignedSiteId" (ngModelChange)="changed.emit()" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"><option value="">Unassigned</option><option *ngFor="let site of sites" [value]="site.id">{{ site.name }}</option></select></label>
        <label class="text-xs text-gray-400 md:col-span-2">Notes<textarea [(ngModel)]="asset.notes" (ngModelChange)="changed.emit()" rows="3" class="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"></textarea></label>
        <div *ngIf="!canSubmit && submitDisabledReason" class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100 md:col-span-2">{{ submitDisabledReason }}</div>
        <button type="button" (click)="save.emit()" [disabled]="busy || !canSubmit" class="rounded-lg bg-yellow-500 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2">{{ busy ? 'Saving...' : submitLabel }}</button>
      </div>
    </section>
  `,
})
export class AssetFormComponent {
  @Input({ required: true }) asset!: VehicleAsset;
  @Input() sites: Site[] = [];
  @Input() busy = false;
  @Input() message = '';
  @Input() isError = true;
  @Input() canSubmit = true;
  @Input() submitDisabledReason = '';
  @Input() submitLabel = 'Complete registration';
  @Output() readonly save = new EventEmitter<void>();
  @Output() readonly changed = new EventEmitter<void>();
}
