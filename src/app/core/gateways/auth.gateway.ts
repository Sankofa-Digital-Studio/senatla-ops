import { InjectionToken } from '@angular/core';
import { AuthSession } from '../models/app.models';

export interface RegistrationRequest {
  email: string;
  password: string;
  displayName: string;
  adminCode?: string;
}

export interface RegistrationResult {
  success: boolean;
  confirmationRequired: boolean;
  adminGranted: boolean;
  message?: string;
}

export interface AuthGateway {
  loadSession(): Promise<AuthSession | null>;
  login(username: string, password: string): Promise<AuthSession | null>;
  register(request: RegistrationRequest): Promise<RegistrationResult>;
  redeemAdminCode(code: string): Promise<boolean>;
  logout(): Promise<void>;
  subscribeToSession?(listener: (session: AuthSession | null) => void): () => void;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');