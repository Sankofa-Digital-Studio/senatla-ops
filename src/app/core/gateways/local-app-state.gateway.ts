import { Injectable } from '@angular/core';
import { AppStateGateway, AppStateSnapshot } from './app-state.gateway';

@Injectable()
export class LocalAppStateGateway implements AppStateGateway {
  private readonly storageKey = 'senatla_ops_data';
  private readonly legacyStorageKey = 'senatla_ops_data';

  async loadState(): Promise<AppStateSnapshot | null> {
    const sessionData = sessionStorage.getItem(this.storageKey);
    if (sessionData) {
      return JSON.parse(sessionData) as AppStateSnapshot;
    }

    const legacyData = localStorage.getItem(this.legacyStorageKey);
    if (!legacyData) return null;

    sessionStorage.setItem(this.storageKey, legacyData);
    localStorage.removeItem(this.legacyStorageKey);
    return JSON.parse(legacyData) as AppStateSnapshot;
  }

  async saveState(snapshot: AppStateSnapshot): Promise<void> {
    sessionStorage.setItem(this.storageKey, JSON.stringify(snapshot));
  }
}
