import { InjectionToken } from '@angular/core';
import { AuthSession, DemoUser } from '../models/app.models';

export interface AuthGateway {
  loadSession(): Promise<AuthSession | null>;
  login(username: string, password: string): Promise<AuthSession | null>;
  logout(): Promise<void>;
  demoUsers(): DemoUser[];
  subscribeToSession?(listener: (session: AuthSession | null) => void): () => void;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
