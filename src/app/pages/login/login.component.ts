import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { RUNTIME_CONFIG, RuntimeConfig } from 'src/app/core/config/runtime-config';
import { AppRole, AuthSession } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';
import { OnboardingFeature, OnboardingService } from 'src/app/core/services/onboarding.service';

const LOGIN_PREF_KEY = 'senatla_ops_login_pref_v1';

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
  private readonly onboarding = inject(OnboardingService);
  readonly config = inject<RuntimeConfig>(RUNTIME_CONFIG);
  readonly auth = inject(AuthService);
  private routeSubscription?: Subscription;

  username = '';
  password = '';
  showPassword = false;
  rememberLogin = false;
  errorMsg = '';
  requestedRole: AppRole | null = null;
  redirectUrl = '';
  isSubmitting = false;
  isFetchingResources = false;
  showWizard = false;
  activeStep = 0;
  authenticatedRole: AppRole | null = null;
  private authenticatedUserId = '';
  private authenticatedRedirect = '';

  get usernameLabel() {
    return 'Work Email';
  }

  get usernamePlaceholder() {
    return 'manager@senatla.com';
  }

  get passwordPlaceholder() {
    return 'Enter account password';
  }

  get modeHint() {
    return 'Secure access portal · Supabase-backed sign-in for operational roles';
  }

  get wizardFeatures(): OnboardingFeature[] {
    return this.onboarding.featuresFor(this.authenticatedRole);
  }

  get currentWizardFeature(): OnboardingFeature | null {
    return this.wizardFeatures[this.activeStep] ?? null;
  }

  get isLastWizardStep() {
    return this.activeStep >= this.wizardFeatures.length - 1;
  }

  ngOnInit() {
    this.restoreLoginPreference();
    this.routeSubscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      this.requestedRole = this.normalizeRole(params.get('role') ?? '');
      this.redirectUrl = this.sanitizeRedirect(query.get('redirect'));
      this.errorMsg = '';

      if (query.get('onboarding') === '1') {
        void this.openAuthenticatedWizard();
      }
    });
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
  }

  async handleLogin() {
    if (this.isSubmitting || this.showWizard) return;

    this.errorMsg = '';
    this.isSubmitting = true;
    this.isFetchingResources = true;

    try {
      const session = await this.auth.login(this.username, this.password);
      const role = this.requestedRole || session?.role || null;

      if (!role) {
        await this.auth.logout();
        this.errorMsg = 'This account is missing a role assignment in the backend profile.';
        return;
      }

      if (!session || session.role !== role) {
        await this.auth.logout();
        this.errorMsg = 'Invalid credentials for the selected role.';
        return;
      }

      this.persistLoginPreference();
      await this.fetchRoleResources(session);
      this.startWizardOrNavigate(session, this.redirectUrl || this.getRolePath(role), false);
    } finally {
      this.isFetchingResources = false;
      this.isSubmitting = false;
    }
  }

  previousWizardStep() {
    this.activeStep = Math.max(0, this.activeStep - 1);
  }

  nextWizardStep() {
    if (!this.isLastWizardStep) {
      this.activeStep += 1;
      return;
    }
    this.completeWizard();
  }

  async completeWizard() {
    if (!this.authenticatedUserId || !this.authenticatedRole) return;
    this.onboarding.complete(this.authenticatedUserId, this.authenticatedRole);
    this.showWizard = false;
    await this.router.navigateByUrl(this.authenticatedRedirect || this.getRolePath(this.authenticatedRole));
  }

  private restoreLoginPreference() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOGIN_PREF_KEY) || 'null') as { username?: string } | null;
      if (!parsed?.username) return;
      this.username = parsed.username;
      this.rememberLogin = true;
    } catch {
      localStorage.removeItem(LOGIN_PREF_KEY);
    }
  }

  private persistLoginPreference() {
    if (!this.rememberLogin) {
      localStorage.removeItem(LOGIN_PREF_KEY);
      return;
    }

    localStorage.setItem(LOGIN_PREF_KEY, JSON.stringify({ username: this.username.trim() }));
  }
  private async openAuthenticatedWizard() {
    await this.auth.ensureReady();
    const session = this.auth.currentSession();
    if (!session) return;
    this.startWizardOrNavigate(session, this.redirectUrl || this.getRolePath(session.role), true);
  }

  private async fetchRoleResources(_session: AuthSession) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  private startWizardOrNavigate(session: AuthSession, redirect: string, forceWizard: boolean) {
    this.authenticatedRole = session.role;
    this.authenticatedUserId = session.userId;
    this.authenticatedRedirect = redirect;
    this.activeStep = 0;

    if (!forceWizard && this.onboarding.isComplete(session.userId, session.role)) {
      void this.router.navigateByUrl(redirect);
      return;
    }

    this.showWizard = true;
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