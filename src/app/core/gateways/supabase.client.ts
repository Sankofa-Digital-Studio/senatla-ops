import { inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RUNTIME_CONFIG } from '../config/runtime-config';

let client: SupabaseClient | null = null;

export function injectSupabaseClient() {
  const config = inject(RUNTIME_CONFIG);

  if (!client) {
    if (!config.api.supabaseUrl || !config.api.supabaseAnonKey) {
      throw new Error('Supabase authentication requires supabaseUrl and supabaseAnonKey.');
    }

    client = createClient(config.api.supabaseUrl, config.api.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
