import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { AppRole } from '../models/app.models';
import { AuthService } from '../services/auth.service';

function sanitizeRequestedUrl(url: string) {
  if (!url || !url.startsWith('/')) return '/';
  if (url.startsWith('//') || url.startsWith('/login')) return '/';
  return url;
}

function getLoginTree(router: Router, expectedRole: AppRole | undefined, requestedUrl: string): UrlTree {
  return router.createUrlTree(expectedRole ? ['/login', expectedRole] : ['/login'], {
    queryParams: { redirect: sanitizeRequestedUrl(requestedUrl) },
  });
}

function hasAccess(expectedRole?: AppRole, requestedUrl: string = '/') {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.canAccess()) {
    return getLoginTree(router, expectedRole, requestedUrl);
  }

  if (expectedRole && !auth.canAccess(expectedRole)) {
    void auth.logout();
    return getLoginTree(router, expectedRole, requestedUrl);
  }

  return true;
}

export function roleCanMatch(expectedRole?: AppRole): CanMatchFn {
  return (_route: Route, segments: UrlSegment[]) => {
    const requestedUrl = '/' + segments.map((segment) => segment.path).join('/');
    return hasAccess(expectedRole, requestedUrl);
  };
}

export function roleCanActivate(expectedRole?: AppRole): CanActivateFn {
  return (_route, state) => hasAccess(expectedRole, state.url || '/');
}
