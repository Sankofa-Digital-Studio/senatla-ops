import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SENATLA_TRADING_ORGANIZATION_ID } from '../../core/models/app.models';
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
