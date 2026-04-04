import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AppRole } from '../models/app.models';
import { AuthService } from '../services/auth.service';

function hasAccess(expectedRole?: AppRole, segments: UrlSegment[] = []) {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: '/' + segments.map((segment) => segment.path).join('/') },
    });
  }

  if (expectedRole && auth.role() !== expectedRole) {
    return router.createUrlTree(['/landing']);
  }

  return true;
}

export function roleCanMatch(expectedRole?: AppRole): CanMatchFn {
  return (_route, segments) => hasAccess(expectedRole, segments);
}

export function roleCanActivate(expectedRole?: AppRole): CanActivateFn {
  return (_route, state) => {
    const segments = state.url
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .map((path) => ({ path } as UrlSegment));
    return hasAccess(expectedRole, segments);
  };
}
