import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(waitForAsync(() => {
    resetTestStorage();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects a valid account when the selected role is wrong', async () => {
    component.requestedRole = 'office';
    component.username = 'director.exec@test.invalid';
    component.password = 'test-password';

    await component.handleLogin();

    expect(component.errorMsg).toBe('Invalid credentials for the selected role.');
  });

  it('uses the production login hint', () => {
    expect(component.modeHint).toContain('Secure access portal');
  });
});
