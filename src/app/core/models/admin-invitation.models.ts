export type AdminInvitationStatus = 'active' | 'expired' | 'exhausted' | 'revoked';
export interface AdminInvitation {
  id: string; label: string; codeSuffix: string; expiresAt: string; maxUses: number; usedCount: number;
  status: AdminInvitationStatus; createdAt: string; createdByName: string; lastUsedAt: string | null; revokedAt: string | null;
}
export interface AdminInvitationInput { label: string; expiresInHours: number; maxUses: number; }
