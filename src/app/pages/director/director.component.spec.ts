import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { DirectorComponent } from './director.component';

describe('DirectorComponent', () => {
  let component: DirectorComponent;
  let fixture: ComponentFixture<DirectorComponent>;

  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({
      imports: [DirectorComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();

    fixture = TestBed.createComponent(DirectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not expose payroll or wage-derived Director metrics in UAT v1', () => {
    const text = fixture.nativeElement.textContent.toLowerCase();
    for (const forbidden of ['payroll', 'salary', 'basic rate', 'tax', 'actual daily cost', 'actual month cost', 'actual ytd cost', 'cost contribution']) {
      expect(text).not.toContain(forbidden);
    }
    expect(text).toContain('present today');
    expect(text).toContain('absent today');
  });
});
