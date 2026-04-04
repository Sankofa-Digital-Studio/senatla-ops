import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { APP_STATE_GATEWAY } from './app-state.gateway';
import { AUTH_GATEWAY } from './auth.gateway';
import { LocalAppStateGateway } from './local-app-state.gateway';
import { LocalDemoAuthGateway } from './local-demo-auth.gateway';

export function provideBackendGateways(): Provider[] {
  if (environment.api.mode !== 'local') {
    throw new Error(`API mode "${environment.api.mode}" is not implemented yet.`);
  }

  return [
    { provide: APP_STATE_GATEWAY, useClass: LocalAppStateGateway },
    { provide: AUTH_GATEWAY, useClass: LocalDemoAuthGateway },
  ];
}
