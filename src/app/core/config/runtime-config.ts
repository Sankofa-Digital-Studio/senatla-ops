import { InjectionToken, Provider } from '@angular/core';

export type ApiMode = 'local' | 'supabase';

export interface RuntimeConfig {
  api: {
    mode: ApiMode;
    baseUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  api: {
    mode: 'local',
    baseUrl: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
  },
};

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');

export function provideRuntimeConfig(config: RuntimeConfig): Provider {
  return { provide: RUNTIME_CONFIG, useValue: config };
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch('/assets/runtime-config.json', { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_RUNTIME_CONFIG;
    }

    const parsed = (await response.json()) as Partial<RuntimeConfig>;
    return {
      api: {
        ...DEFAULT_RUNTIME_CONFIG.api,
        ...parsed.api,
      },
    };
  } catch {
    return DEFAULT_RUNTIME_CONFIG;
  }
}
