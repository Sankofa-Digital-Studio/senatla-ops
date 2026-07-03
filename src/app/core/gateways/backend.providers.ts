import { Provider } from '@angular/core';
import { APP_STATE_GATEWAY } from './app-state.gateway';
import { AUTH_GATEWAY } from './auth.gateway';
import { LocalAppStateGateway } from './local-app-state.gateway';
import { LocalDemoAuthGateway } from './local-demo-auth.gateway';
import { RuntimeConfig } from '../config/runtime-config';
import { SupabaseAppStateGateway } from './supabase-app-state.gateway';
import { SupabaseAuthGateway } from './supabase-auth.gateway';

export function provideBackendGateways(config: RuntimeConfig): Provider[] {
  if (config.api.mode === 'local') {
    return [
      { provide: APP_STATE_GATEWAY, useClass: LocalAppStateGateway },
      { provide: AUTH_GATEWAY, useClass: LocalDemoAuthGateway },
    ];
  }

  if (config.api.mode === 'supabase') {
    return [
      { provide: APP_STATE_GATEWAY, useClass: SupabaseAppStateGateway },
      { provide: AUTH_GATEWAY, useClass: SupabaseAuthGateway },
    ];
  }

  throw new Error(`API mode "${config.api.mode}" is not implemented.`);
}
