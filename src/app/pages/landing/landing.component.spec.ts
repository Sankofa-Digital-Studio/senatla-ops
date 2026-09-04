import { ComponentFixture, TestBed } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { detectDevicePlatform, LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(() => {
    resetTestStorage();
    TestBed.configureTestingModule({ imports: [LandingComponent], providers: TEST_APP_PROVIDERS });
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('keeps operational role names off the public hero', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent?.toLowerCase() || '';
    expect(text).not.toContain('site manager');
    expect(text).not.toContain('office admin');
    expect(text).not.toContain('director');
  });

  it('provides distinct in-page destinations for capabilities and assurance', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('a[href="#capabilities"]')).not.toBeNull();
    expect(page.querySelector('a[href="#assurance"]')).not.toBeNull();
    expect(page.querySelector('#capabilities')).not.toBeNull();
    expect(page.querySelector('#assurance')).not.toBeNull();
  });

  it('offers honest iOS web-app and Android APK choices', () => {
    const page = fixture.nativeElement as HTMLElement;
    const href = 'https://github.com/Sankofa-Digital-Studio/senatla-ops/releases/download/dev-latest/senatla-ops-dev.apk';
    expect(page.querySelector('#mobile-app')).not.toBeNull();
    expect(page.querySelectorAll('a[href="' + href + '"]').length).toBe(1);
    expect(page.textContent).toContain('iPhone / iPad web app');
    expect(page.textContent).toContain('Download Android APK');
  });

  it('detects Android, iPhone, iPadOS, and non-mobile visitors', () => {
    expect(detectDevicePlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android');
    expect(detectDevicePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios');
    expect(detectDevicePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 5)).toBe('ios');
    expect(detectDevicePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('other');
  });
  it('shows the cornerstone welcome gate while the landing page is preparing', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.cornerstone-loader')).not.toBeNull();
    expect(page.textContent).toContain('Senatla means a rock');
  });
  it('offers public registration and login navigation', () => {
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map((link) => link.getAttribute('href'));
    expect(links).toContain('/register');
    expect(links).toContain('/login');
  });
});
