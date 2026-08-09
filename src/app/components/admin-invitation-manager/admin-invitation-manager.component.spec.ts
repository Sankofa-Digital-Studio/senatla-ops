import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { AdminInvitationManagerComponent } from './admin-invitation-manager.component';

describe('AdminInvitationManagerComponent', () => {
  let component: AdminInvitationManagerComponent;
  let fixture: ComponentFixture<AdminInvitationManagerComponent>;
  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({ imports: [AdminInvitationManagerComponent], providers: TEST_APP_PROVIDERS }).compileComponents();
    fixture = TestBed.createComponent(AdminInvitationManagerComponent); component = fixture.componentInstance; fixture.detectChanges();
  }));
  afterEach(() => component.ngOnDestroy());
  it('creates the invitation manager', () => expect(component).toBeTruthy());
  it('rejects unsafe issuance bounds', async () => { component.label = 'x'; component.maxUses = 26; await component.issue(); expect(component.feedback()).toContain('1–25 uses'); });
  it('reveals a locally issued code once and adds only safe metadata to the register', async () => {
    component.label = 'Test administrator'; component.expiresInHours = 24; component.maxUses = 1; await component.issue();
    expect(component.revealedCode()).toContain('LOCAL-'); expect(component.service.invitations()[0].label).toBe('Test administrator');
    expect(JSON.stringify(component.service.invitations()[0])).not.toContain(component.revealedCode());
    component.clearRevealedCode(); expect(component.revealedCode()).toBe('');
  });
  it('requires an explicit second action before revocation', async () => {
    component.label = 'Revoke test'; await component.issue(); const invitation = component.service.invitations()[0];
    component.requestRevoke(invitation.id); expect(component.pendingRevokeId()).toBe(invitation.id);
    await component.confirmRevoke(invitation); expect(component.service.invitations()[0].status).toBe('revoked');
  });
});
