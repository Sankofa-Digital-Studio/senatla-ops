import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyLog, Employee, VehicleAsset } from '../core/models/app.models';
import { AttendanceRowComponent } from './attendance-row.component';
import { AssetRegistrationWorkspaceComponent } from './asset-registration-workspace.component';
import { TimesheetSummaryComponent } from './timesheet-summary.component';
import { UiButtonComponent } from './ui-button.component';
import { UiTabNavComponent } from './ui-tab-nav.component';

describe('UI architecture components', () => {
  it('keeps command button behavior inside an isolated primitive', async () => {
    await TestBed.configureTestingModule({ imports: [UiButtonComponent] }).compileComponents();
    const fixture = TestBed.createComponent(UiButtonComponent);
    const pressed = jasmine.createSpy('pressed');
    fixture.componentInstance.pressed.subscribe(pressed);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(pressed).toHaveBeenCalled();
  });

  it('emits stable tab identifiers without owning page state', async () => {
    await TestBed.configureTestingModule({ imports: [UiTabNavComponent] }).compileComponents();
    const fixture = TestBed.createComponent(UiTabNavComponent);
    fixture.componentRef.setInput('tabs', [{ id: 'overview', label: 'Overview' }, { id: 'assets', label: 'Assets' }]);
    fixture.componentRef.setInput('activeId', 'overview');
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.selected.subscribe(selected);
    fixture.detectChanges();

    fixture.nativeElement.querySelectorAll('button')[1].click();

    expect(selected).toHaveBeenCalledWith('assets');
  });

  it('renders the same timesheet metric contract for office and site views', async () => {
    await TestBed.configureTestingModule({ imports: [TimesheetSummaryComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TimesheetSummaryComponent);
    fixture.componentRef.setInput('summary', { total: 10, present: 7, absent: 2, pending: 1, flagged: 1, evidence: 7, completionPercent: 90 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.summary > div').length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('90%');
  });

  it('keeps an attendance row presentational and emits domain events', async () => {
    await TestBed.configureTestingModule({ imports: [AttendanceRowComponent] }).compileComponents();
    const fixture = TestBed.createComponent(AttendanceRowComponent);
    const employee = employeeFixture();
    const log: DailyLog = { date: '2026-07-02', status: 'pending' };
    fixture.componentRef.setInput('employee', employee);
    fixture.componentRef.setInput('log', log);
    fixture.componentRef.setInput('reasons', ['Sick', 'AWOL']);
    const statusChange = jasmine.createSpy('statusChange');
    fixture.componentInstance.statusChange.subscribe(statusChange);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[data-status="present"]').click();

    expect(statusChange).toHaveBeenCalledWith({ employee, status: 'present' });
  });

  it('renders asset registration without injecting feature services', async () => {
    await TestBed.configureTestingModule({ imports: [AssetRegistrationWorkspaceComponent] }).compileComponents();
    const fixture: ComponentFixture<AssetRegistrationWorkspaceComponent> = TestBed.createComponent(AssetRegistrationWorkspaceComponent);
    fixture.componentRef.setInput('asset', assetFixture());
    fixture.componentRef.setInput('sites', []);
    fixture.componentRef.setInput('reminders', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Capture and scan');
    expect(fixture.nativeElement.querySelector('app-asset-form')).toBeTruthy();
  });
});

function employeeFixture(): Employee {
  return {
    id: 'employee-1', firstName: 'Lebo', surname: 'Mokoena', idNumber: '9001010000000', role: 'Operator', siteId: 'site-1',
    startDate: '2026-01-01', basicRate: 100, salaryAdvances: 0, financials: {}, logs: {}, adjustments: {},
  };
}

function assetFixture(): VehicleAsset {
  return {
    id: 'asset-1', make: 'Toyota', model: 'Hilux', type: 'Light Vehicle', licenseExpiry: '2027-01-01', status: 'Active',
  };
}
