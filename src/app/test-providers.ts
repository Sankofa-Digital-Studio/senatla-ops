import { Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { DEFAULT_RUNTIME_CONFIG, provideRuntimeConfig } from './core/config/runtime-config';
import { AUTH_GATEWAY } from './core/gateways/auth.gateway';
import { provideBackendGateways } from './core/gateways/backend.providers';
import { AppRole, AuthSession } from './core/models/app.models';

class TestAuthGateway {
  private session: AuthSession | null = null;
  private readonly credentials = new Map<string, { password: string; role: AppRole; displayName: string }>([
    ['site.manager@test.invalid', { password: 'test-password', role: 'site', displayName: 'Site Manager' }],
    ['office.admin@test.invalid', { password: 'test-password', role: 'office', displayName: 'Office Admin' }],
    ['director.exec@test.invalid', { password: 'test-password', role: 'director', displayName: 'Director' }],
  ]);

  async loadSession(): Promise<AuthSession | null> {
    return this.session;
  }

  async login(username: string, password: string): Promise<AuthSession | null> {
    const user = this.credentials.get(username.trim().toLowerCase());
    if (!user || user.password !== password.trim()) return null;

    this.session = {
      userId: `${user.role}-user`,
      username: username.trim().toLowerCase(),
      role: user.role,
      displayName: user.displayName,
      organizationId: '00000000-0000-4000-8000-000000000001',
      permittedSiteIds: user.role === 'site' ? ['site-1'] : [],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    };

    return this.session;
  }

  async logout(): Promise<void> {
    this.session = null;
  }
}

export const TEST_APP_PROVIDERS = [
  provideRouter(routes),
  provideRuntimeConfig(DEFAULT_RUNTIME_CONFIG),
  ...provideBackendGateways(DEFAULT_RUNTIME_CONFIG),
  { provide: AUTH_GATEWAY, useClass: TestAuthGateway },
];

export function resetTestStorage() {
  sessionStorage.clear();
  localStorage.clear();
}
