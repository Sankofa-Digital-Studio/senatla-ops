import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.aria-label]="ariaLabel || null"
      [attr.aria-busy]="busy"
      [class]="'ui-button ui-button--' + variant + ' ui-button--' + size"
      [class.ui-button--block]="block"
      [disabled]="disabled || busy"
      [type]="type"
      (click)="pressed.emit($event)"
    >
      <span *ngIf="busy" class="ui-button__spinner" aria-hidden="true"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    :host:has(.ui-button--block) { display: flex; width: 100%; }
    .ui-button { display: inline-flex; min-width: 0; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; border-radius: 6px; font: inherit; font-weight: 700; letter-spacing: 0; cursor: pointer; transition: background-color .15s, border-color .15s, color .15s, opacity .15s; }
    .ui-button:focus-visible { outline: 2px solid #f5a800; outline-offset: 2px; }
    .ui-button:disabled { cursor: not-allowed; opacity: .45; }
    .ui-button--sm { min-height: 32px; padding: 6px 10px; font-size: 11px; }
    .ui-button--md { min-height: 40px; padding: 8px 14px; font-size: 13px; }
    .ui-button--lg { min-height: 48px; padding: 10px 18px; font-size: 14px; }
    .ui-button--block { width: 100%; }
    .ui-button--primary { border-color: #f5a800; background: #f5a800; color: #171000; }
    .ui-button--primary:hover:not(:disabled) { background: #ffb617; }
    .ui-button--secondary { border-color: #47515c; background: #171d23; color: #edf1f4; }
    .ui-button--secondary:hover:not(:disabled) { border-color: #697785; background: #202832; }
    .ui-button--danger { border-color: #7f1d1d; background: #2a1113; color: #fca5a5; }
    .ui-button--success { border-color: #166534; background: #12301f; color: #86efac; }
    .ui-button--ghost { border-color: transparent; background: transparent; color: #aeb8c2; }
    .ui-button--ghost:hover:not(:disabled) { background: #1a222b; color: #fff; }
    .ui-button__spinner { width: 13px; height: 13px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .ui-button { transition: none; } .ui-button__spinner { animation-duration: 1.4s; } }
  `],
})
export class UiButtonComponent {
  @Input() variant: UiButtonVariant = 'secondary';
  @Input() size: UiButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() busy = false;
  @Input() block = false;
  @Input() ariaLabel = '';
  @Output() readonly pressed = new EventEmitter<Event>();
}
