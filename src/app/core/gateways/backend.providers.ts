import { Provider } from '@angular/core';
import { APP_STATE_GATEWAY } from './app-state.gateway';
import { AUTH_GATEWAY } from './auth.gateway';
import { LocalAppStateGateway } from './local-app-state.gateway';
import { LocalReviewAuthGateway } from './local-review-auth.gateway';
import { RuntimeConfig } from '../config/runtime-config';
import { SupabaseAppStateGateway } from './supabase-app-state.gateway';
import { SupabaseAuthGateway } from './supabase-auth.gateway';
import { READINESS_GATEWAY } from './readiness.gateway';
import { SupabaseReadinessGateway } from './supabase-readiness.gateway';
import { UnavailableReadinessGateway } from './unavailable-readiness.gateway';

export function provideBackendGateways(config: RuntimeConfig): Provider[] {
  const appStateGateway = config.api.mode === 'local'
    ? LocalAppStateGateway
    : config.api.mode === 'supabase'
      ? SupabaseAppStateGateway
      : null;
  const authGateway = config.api.mode === 'local'
    ? LocalReviewAuthGateway
    : config.api.mode === 'supabase'
      ? SupabaseAuthGateway
      : null;
  const readinessGateway = config.api.mode === 'supabase'
    ? SupabaseReadinessGateway
    : UnavailableReadinessGateway;

  if (!appStateGateway || !authGateway) {
    throw new Error(`API mode "${config.api.mode}" is not implemented.`);
  }

  return [
    { provide: APP_STATE_GATEWAY, useClass: appStateGateway },
    { provide: AUTH_GATEWAY, useClass: authGateway },
    { provide: READINESS_GATEWAY, useClass: readinessGateway },
  ];
}
