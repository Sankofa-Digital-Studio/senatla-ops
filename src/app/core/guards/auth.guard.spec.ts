import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { roleCanActivate } from './auth.guard';

describe('roleCanActivate', () => {
  beforeEach(async () => {
    resetTestStorage();
    await TestBed.configureTestingModule({ providers: TEST_APP_PROVIDERS }).compileComponents();
  });

  it('redirects anonymous users to the requested role login', async () => {
    const router = TestBed.inject(Router);
    const result = await TestBed.runInInjectionContext(() =>
      roleCanActivate('office')({} as never, { url: '/office-admin' } as never),
    );

    expect(result).not.toBeTrue();
    expect(router.serializeUrl(result as never)).toContain('/login/office');
    expect(router.serializeUrl(result as never)).toContain('redirect=%2Foffice-admin');
  });

  it('permits only the authenticated role', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.login('office.admin@test.invalid', 'test-password');

    const officeResult = await TestBed.runInInjectionContext(() =>
      roleCanActivate('office')({} as never, { url: '/office-admin' } as never),
    );
    expect(officeResult).toBeTrue();

    const directorResult = await TestBed.runInInjectionContext(() =>
      roleCanActivate('director')({} as never, { url: '/director' } as never),
    );
    expect(directorResult).not.toBeTrue();
    expect(auth.isAuthenticated()).toBeFalse();
  });
});
