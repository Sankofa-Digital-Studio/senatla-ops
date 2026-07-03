import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { RUNTIME_CONFIG, RuntimeConfig } from 'src/app/core/config/runtime-config';
import { AppRole } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly config = inject<RuntimeConfig>(RUNTIME_CONFIG);
  readonly auth = inject(AuthService);
  private routeSubscription?: Subscription;

  username = '';
  password = '';
  errorMsg = '';
  requestedRole: AppRole | null = null;
  redirectUrl = '';

  get hasDemoShortcuts() {
    return this.auth.demoUsers().length > 0;
  }

  get usernameLabel() {
    return this.hasDemoShortcuts ? 'Username' : 'Work Email';
  }

  get usernamePlaceholder() {
    return this.hasDemoShortcuts ? 'office.admin' : 'manager@senatla.com';
  }

  get passwordPlaceholder() {
    return this.hasDemoShortcuts ? 'Enter demo password' : 'Enter account password';
  }

  get modeHint() {
    if (this.config.auth.reviewBypassEnabled) {
      return 'Review mode is enabled. Known seeded profiles can enter even if Supabase password sign-in is blocked.';
    }

    return this.config.api.mode === 'supabase'
      ? 'Supabase-backed sign-in for operational roles'
      : 'Secure access portal for operational roles';
  }

  ngOnInit() {
    this.routeSubscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      this.requestedRole = this.normalizeRole(params.get('role') ?? '');
      this.redirectUrl = this.sanitizeRedirect(query.get('redirect'));
      this.errorMsg = '';
    });
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
  }

  async handleLogin() {
    const session = await this.auth.login(this.username, this.password);
    const role = this.requestedRole || this.inferRoleFromUsername(this.username) || session?.role || null;

    if (!role) {
      await this.auth.logout();
      this.errorMsg = this.hasDemoShortcuts
        ? 'Select a role first or use one of the role-specific demo accounts.'
        : 'This account is missing a role assignment in the backend profile.';
      return;
    }

    if (!session || session.role !== role) {
      await this.auth.logout();
      this.errorMsg = 'Invalid credentials for the selected role.';
      return;
    }

    this.errorMsg = '';
    await this.router.navigateByUrl(this.redirectUrl || this.getRolePath(role));
  }

  useDemo(role: AppRole) {
    const credential = this.auth.demoUsers().find((user) => user.role === role);
    if (!credential) return;
    this.requestedRole = role;
    this.username = credential.username;
    this.password = credential.password;
    this.errorMsg = '';
  }

  private inferRoleFromUsername(username: string): AppRole | null {
    if (!this.hasDemoShortcuts) {
      return this.requestedRole;
    }
    const value = username.trim().toLowerCase();
    const match = this.auth.demoUsers().find((credential) => credential.username === value);
    return match?.role ?? null;
  }

  private normalizeRole(input: string): AppRole | null {
    if (input === 'site' || input === 'office' || input === 'director') {
      return input;
    }
    return null;
  }

  private getRolePath(role: AppRole) {
    if (role === 'site') return '/site-manager';
    if (role === 'office') return '/office-admin';
    return '/director';
  }

  private sanitizeRedirect(redirect: string | null): string {
    if (!redirect || !redirect.startsWith('/')) return '';
    if (redirect.startsWith('//')) return '';
    if (redirect.startsWith('/login')) return '';
    return redirect;
  }
}
