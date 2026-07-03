import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type UiFeedbackTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-ui-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="message" class="feedback" [attr.data-tone]="tone" role="status">{{ message }}</div>`,
  styles: [`
    :host { display: block; }
    .feedback { padding: 10px 12px; border: 1px solid; border-radius: 6px; font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    .feedback[data-tone='info'] { border-color: #1e4f78; background: #102235; color: #bfdbfe; }
    .feedback[data-tone='success'] { border-color: #166534; background: #102a1b; color: #bbf7d0; }
    .feedback[data-tone='warning'] { border-color: #854d0e; background: #2c210d; color: #fde68a; }
    .feedback[data-tone='error'] { border-color: #991b1b; background: #321315; color: #fecaca; }
  `],
})
export class UiFeedbackComponent {
  @Input() message = '';
  @Input() tone: UiFeedbackTone = 'info';
}
