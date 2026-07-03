import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { DEFAULT_RUNTIME_CONFIG, provideRuntimeConfig } from './core/config/runtime-config';
import { provideBackendGateways } from './core/gateways/backend.providers';

export const TEST_APP_PROVIDERS = [
  provideRouter(routes),
  provideRuntimeConfig(DEFAULT_RUNTIME_CONFIG),
  ...provideBackendGateways(DEFAULT_RUNTIME_CONFIG),
];

export function resetTestStorage() {
  sessionStorage.clear();
  localStorage.clear();
}
