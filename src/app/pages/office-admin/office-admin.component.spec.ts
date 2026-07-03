import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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
});
