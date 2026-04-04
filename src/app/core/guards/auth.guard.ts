import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AppRole } from '../models/app.models';
import { AuthService } from '../services/auth.service';

function hasAccess(expectedRole?: AppRole, segments: UrlSegment[] = []) {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requestedPath = '/' + segments.map((segment) => segment.path).join('/');

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(expectedRole ? ['/login', expectedRole] : ['/login'], {
      queryParams: { redirect: requestedPath || '/' },
    });
  }

  if (expectedRole && auth.role() !== expectedRole) {
    auth.logout();
    return router.createUrlTree(['/login', expectedRole], {
      queryParams: { redirect: requestedPath || '/' },
    });
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
