import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AppRole } from './core/models/app.models';
import { AuthService } from './core/services/auth.service';

const requireRole = (role: AppRole): CanActivateFn => () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.canAccess(role)) {
    return true;
  }

  return router.createUrlTree(['/login', role]);
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'login/:role',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'site-manager',
    canActivate: [requireRole('site')],
    loadComponent: () => import('./pages/site-manager/site-manager.component').then((m) => m.SiteManagerComponent),
  },
  {
    path: 'office-admin',
    canActivate: [requireRole('office')],
    loadComponent: () => import('./pages/office-admin/office-admin.component').then((m) => m.OfficeAdminComponent),
  },
  {
    path: 'director',
    canActivate: [requireRole('director')],
    loadComponent: () => import('./pages/director/director.component').then((m) => m.DirectorComponent),
  },
  {
    path: 'asset-register',
    canActivate: [requireRole('office')],
    loadComponent: () => import('./pages/asset-register/asset-register.component').then((m) => m.AssetRegisterComponent),
  },
  {
    path: '**',
    redirectTo: 'landing',
  },
];
