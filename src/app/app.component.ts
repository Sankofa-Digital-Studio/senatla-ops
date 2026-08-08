import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { TimeControlsComponent } from './components/time-controls.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TimeControlsComponent],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly showDebugControls = !environment.production;
  readonly navLinks = computed(() => {
    const role = this.auth.role();
    if (role === 'site') return [{ label: 'Site Manager', path: '/site-manager' }, { label: 'Asset Register', path: '/asset-register' }];
    if (role === 'office') return [{ label: 'Office Admin', path: '/office-admin' }, { label: 'Asset Register', path: '/asset-register' }];
    if (role === 'director') return [{ label: 'Director', path: '/director' }, { label: 'Asset Register', path: '/asset-register' }];
    return [];
  });

  get sessionRole() { return this.auth.role(); }

  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/landing');
  }
}
