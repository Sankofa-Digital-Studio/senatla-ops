import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';

import { SiteManagerComponent } from './site-manager.component';

describe('SiteManagerComponent', () => {
  let component: SiteManagerComponent;
  let fixture: ComponentFixture<SiteManagerComponent>;

  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({
      imports: [SiteManagerComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();

    fixture = TestBed.createComponent(SiteManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets an employee to absent directly from the register', () => {
    component.service.setTime(10, 0);
    const employee = component.service.employees()[0];

    component.setAttendanceStatus(employee, 'absent');

    expect(component.getLog(component.service.employees()[0]).status).toBe('absent');
    expect(component.registerSummary().absent).toBeGreaterThan(0);
  });

  it('surfaces the recent immutable attendance audit feed', () => {
    component.service.setTime(10, 0);
    const employee = component.service.employees()[0];

    component.setAttendanceStatus(employee, 'absent');
    fixture.detectChanges();

    expect(component.recentAttendanceAudit().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Recent Audit Evidence');
    expect(fixture.nativeElement.textContent).toContain('attendance_marked_absent');
  });
});
