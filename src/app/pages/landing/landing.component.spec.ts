import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({ imports: [LandingComponent], providers: TEST_APP_PROVIDERS }).compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => expect(component).toBeTruthy());

  it('keeps operational role names off the public hero', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent?.toLowerCase() || '';
    expect(text).not.toContain('site manager');
    expect(text).not.toContain('office admin');
    expect(text).not.toContain('director');
  });

  it('offers public registration and login navigation', () => {
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map((link) => link.getAttribute('href'));
    expect(links).toContain('/register');
    expect(links).toContain('/login');
  });
});