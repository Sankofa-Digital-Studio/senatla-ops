import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class LandingComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly cards = computed(() => {
    const role = this.auth.role();
    return [
      {
        role: 'site',
        title: 'Site Manager',
        description: 'Attendance, toolbox talks, and daily sync sign-off from the field.',
        route: '/site-manager',
        accent: 'border-yellow-500',
        enabled: role === 'site',
      },
      {
        role: 'office',
        title: 'Office Admin',
        description: 'Workforce records, payroll adjustments, and asset administration.',
        route: '/office-admin',
        accent: 'border-blue-500',
        enabled: role === 'office',
      },
      {
        role: 'director',
        title: 'Director',
        description: 'Executive compliance, cost oversight, and operational trends.',
        route: '/director',
        accent: 'border-emerald-500',
        enabled: role === 'director',
      },
    ];
  });

  openRole(route: string, enabled: boolean) {
    if (!enabled) return;
    void this.router.navigateByUrl(route);
  }
}
