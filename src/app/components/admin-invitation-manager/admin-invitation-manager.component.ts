import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminInvitation, AdminInvitationStatus } from '../../core/models/admin-invitation.models';
import { AdminInvitationService } from '../../core/services/admin-invitation.service';

@Component({
  selector: 'app-admin-invitation-manager', standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-invitation-manager.component.html', styleUrls: ['./admin-invitation-manager.component.scss'],
})
export class AdminInvitationManagerComponent implements OnInit, OnDestroy {
  readonly service = inject(AdminInvitationService);
  readonly feedback = signal(''); readonly revealedCode = signal(''); readonly pendingRevokeId = signal('');
  readonly statusFilter = signal<'all' | AdminInvitationStatus>('all'); readonly busy = signal(false);
  label = ''; expiresInHours = 24; maxUses = 1; private clearTimer: ReturnType<typeof setTimeout> | null = null;
  readonly filtered = computed(() => this.statusFilter() === 'all' ? this.service.invitations()
    : this.service.invitations().filter((entry) => entry.status === this.statusFilter()));
  readonly activeCount = computed(() => this.service.invitations().filter((entry) => entry.status === 'active').length);

  ngOnInit() { void this.refresh(); }
  ngOnDestroy() { if (this.clearTimer) clearTimeout(this.clearTimer); this.revealedCode.set(''); }
  async refresh() { await this.execute(() => this.service.load(), 'Invitation list refreshed.'); }
  async issue() {
    if (this.label.trim().length < 3 || this.expiresInHours < 1 || this.expiresInHours > 720 || this.maxUses < 1 || this.maxUses > 25) {
      this.feedback.set('Use a descriptive label, 1–720 hour expiry, and 1–25 uses.'); return;
    }
    await this.execute(async () => {
      const result = await this.service.issue({ label: this.label.trim(), expiresInHours: this.expiresInHours, maxUses: this.maxUses });
      this.revealedCode.set(result.code); this.label = ''; this.maxUses = 1;
      this.feedback.set('Invitation issued. Copy it now—the plaintext will clear automatically in 60 seconds.');
      if (this.clearTimer) clearTimeout(this.clearTimer);
      this.clearTimer = setTimeout(() => this.clearRevealedCode(), 60000);
    });
  }
  async copyCode() {
    if (!this.revealedCode()) return;
    try { await navigator.clipboard.writeText(this.revealedCode()); this.feedback.set('Invitation code copied.'); }
    catch { this.feedback.set('Copy was blocked. Select and copy the code manually before it clears.'); }
  }
  clearRevealedCode() { this.revealedCode.set(''); if (this.clearTimer) clearTimeout(this.clearTimer); this.clearTimer = null; }
  requestRevoke(id: string) { this.pendingRevokeId.set(id); }
  cancelRevoke() { this.pendingRevokeId.set(''); }
  async confirmRevoke(invitation: AdminInvitation) {
    await this.execute(async () => { await this.service.revoke(invitation.id); this.pendingRevokeId.set(''); }, `Invitation “${invitation.label}” revoked.`);
  }
  statusLabel(status: AdminInvitationStatus) { return status[0].toUpperCase() + status.slice(1); }
  private async execute(action: () => Promise<unknown>, successMessage?: string) {
    if (this.busy()) return; this.busy.set(true); this.feedback.set('');
    try { await action(); if (successMessage) this.feedback.set(successMessage); }
    catch (error) { this.feedback.set(error instanceof Error ? error.message : 'Invitation action failed.'); }
    finally { this.busy.set(false); }
  }
}
