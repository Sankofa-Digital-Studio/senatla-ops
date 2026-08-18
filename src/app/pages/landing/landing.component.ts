import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

  async ngOnInit() {
    const startedAt = Date.now();
    await this.auth.ensureReady();
    const remaining = Math.max(0, 900 - (Date.now() - startedAt));
    setTimeout(() => this.landingReady.set(true), remaining);
  }
}