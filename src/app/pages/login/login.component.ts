import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppRole } from 'src/app/core/models/app.models';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  username = '';
  password = '';
  errorMsg = '';
  requestedRole = this.normalizeRole(this.route.snapshot.paramMap.get('role') ?? '');

  handleLogin() {
    const role = this.requestedRole || this.inferRoleFromUsername(this.username);

    if (!role) {
      this.errorMsg = 'Select a role first or use one of the role-specific demo accounts.';
      return;
    }

    const user = this.auth.login(this.username, this.password);
    if (!user || user.role !== role) {
      this.auth.logout();
      this.errorMsg = 'Invalid credentials for the selected role.';
      return;
    }

    this.errorMsg = '';
    this.router.navigateByUrl(this.getRolePath(role));
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
}
