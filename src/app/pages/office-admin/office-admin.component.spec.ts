import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SENATLA_TRADING_ORGANIZATION_ID } from '../../core/models/app.models';
import { AuthService } from '../../core/services/auth.service';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { OfficeAdminComponent } from './office-admin.component';

describe('OfficeAdminComponent', () => {
  let component: OfficeAdminComponent;
  let fixture: ComponentFixture<OfficeAdminComponent>;

  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({
      imports: [OfficeAdminComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();

    fixture = TestBed.createComponent(OfficeAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('forces new email invitations to minimum site access', async () => {
    await TestBed.inject(AuthService).login('office.admin@test.invalid', 'test-password');
    component.inviteForm = { email: 'new@example.com', displayName: 'New User', role: 'director' };
    await component.submitInvite();
    expect(component.service.users()[0].role).toBe('site');
  });

  it('builds a reviewable timesheet register for the selected date', () => {
    component.service.sites.set([{ id: 'site-1', name: 'Workshop', location: 'Yard', isActive: true }]);
    component.service.employees.set([{
      id: 'employee-1', firstName: 'Anele', surname: 'Zulu', idNumber: '9001015009087', role: 'Operator',
      siteId: 'site-1', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0, financials: {},
      adjustments: {}, logs: { '2026-06-27': { date: '2026-06-27', status: 'absent', reason: 'Sick' } },
    }]);
    component.timesheetDate.set('2026-06-27');

    expect(component.timesheetRows()[0].employeeName).toBe('Zulu, Anele');
    expect(component.timesheetSummary().absent).toBe(1);
    expect(component.timesheetSummary().completionPercent).toBe(100);
  });
  it('reviews assignment blockers and offers an eligible same-role alternative', () => {
    component.service.sites.set([
      { id: 'site-a', name: 'North', location: 'A', isActive: true },
      { id: 'site-b', name: 'South', location: 'B', isActive: true },
    ]);
    component.service.employees.set([
      { id: 'blocked', firstName: 'Mpho', surname: 'Zulu', idNumber: '9001015009087', role: 'Operator', siteId: 'site-a', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0, financials: {}, logs: {}, adjustments: {}, employmentStatus: 'active' },
      { id: 'alternative', firstName: 'Anele', surname: 'Botha', idNumber: '9001015009088', role: 'Operator', siteId: 'site-a', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0, financials: {}, logs: {}, adjustments: {}, employmentStatus: 'active' },
    ]);
    component.service.employeeOnboarding.set([
      { id: 'onboarding-alt', organizationId: SENATLA_TRADING_ORGANIZATION_ID, employeeId: 'alternative', criminalCheckStatus: 'pending', fingerprintCheckStatus: 'pending', medicalStatus: 'fit', updatedAt: '2026-08-23T00:00:00Z' },
    ]);
    component.selectedEmployeeIds.set(['blocked']);
    component.setBulkSiteId('site-b');

    component.reviewBulkSiteAssignment();

    expect(component.assignmentReview()?.outcome).toBe('unknown');
    expect(component.assignmentReview()?.items[0].alternatives[0].entityId).toBe('alternative');
  });

  it('shows only pending and failed outbox events in recovery order', () => {
    component.service.integrationOutbox.set([outbox('completed', 8), outbox('failed', 10), outbox('pending', 9)]);
    expect(component.recoveryOutbox().map((event) => event.status)).toEqual(['failed', 'pending']);
  });

  it('retries the existing failed event and preserves its audit context', async () => {
    const failed = { ...outbox('failed', 10), attempts: 1, lastError: 'Remote conflict' };
    component.service.integrationOutbox.set([failed]);
    await component.retryOutboxEvent(failed.id);
    const retried = component.service.integrationOutbox()[0];
    expect(retried.id).toBe(failed.id);
    expect(retried.idempotencyKey).toBe(failed.idempotencyKey);
    expect(retried.status).toBe('pending');
    expect(retried.lastError).toBe('Remote conflict');
  });

  it('blocks another operator retry after a repeated failure', async () => {
    const failed = { ...outbox('failed', 10), attempts: 2 };
    component.service.integrationOutbox.set([failed]);
    await component.retryOutboxEvent(failed.id);
    expect(component.service.integrationOutbox()[0].status).toBe('failed');
    expect(component.feedback()).toContain('requires escalation');
  });

});

function outbox(status: 'pending' | 'processing' | 'completed' | 'failed', hour: number) {
  return {
    id: `event-${status}`, organizationId: SENATLA_TRADING_ORGANIZATION_ID, eventType: 'asset.updated',
    aggregateType: 'asset', aggregateId: 'asset-1', payload: {}, status, idempotencyKey: `key-${status}`,
    attempts: 0, lastError: null, createdAt: `2026-07-07T${hour}:00:00.000Z`, processedAt: null,
  };
}
