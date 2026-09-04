import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export type DevicePlatform = 'android' | 'ios' | 'other';

export function detectDevicePlatform(userAgent: string, maxTouchPoints = 0): DevicePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  return 'other';
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class LandingComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly landingReady = signal(false);
  readonly devicePlatform = signal<DevicePlatform>('other');

  async ngOnInit() {
    this.devicePlatform.set(detectDevicePlatform(navigator.userAgent || '', navigator.maxTouchPoints));
    const startedAt = Date.now();
    await this.auth.ensureReady();
    const remaining = Math.max(0, 900 - (Date.now() - startedAt));
    setTimeout(() => this.landingReady.set(true), remaining);
  }
}