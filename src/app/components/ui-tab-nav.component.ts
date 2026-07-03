import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface UiTabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-ui-tab-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="tab-nav" [attr.aria-label]="ariaLabel">
      <button
        *ngFor="let tab of tabs; trackBy: trackById"
        type="button"
        [attr.aria-current]="activeId === tab.id ? 'page' : null"
        [class.active]="activeId === tab.id"
        [disabled]="tab.disabled"
        (click)="selected.emit(tab.id)"
      >{{ tab.label }}</button>
    </nav>
  `,
  styles: [`
    .tab-nav { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0; scrollbar-width: thin; }
    button { flex: 0 0 auto; min-height: 36px; border: 1px solid #3b4652; border-radius: 6px; background: transparent; color: #c5ced7; padding: 7px 12px; font: inherit; font-size: 11px; font-weight: 700; letter-spacing: 0; text-transform: uppercase; cursor: pointer; }
    button:hover:not(:disabled) { border-color: #657483; color: #fff; }
    button.active { border-color: #f5a800; background: #f5a800; color: #171000; }
    button:focus-visible { outline: 2px solid #f5a800; outline-offset: 2px; }
    button:disabled { cursor: not-allowed; opacity: .4; }
  `],
})
export class UiTabNavComponent {
  @Input() tabs: UiTabItem[] = [];
  @Input() activeId = '';
  @Input() ariaLabel = 'Sections';
  @Output() readonly selected = new EventEmitter<string>();

  trackById(_: number, tab: UiTabItem) {
    return tab.id;
  }
}
