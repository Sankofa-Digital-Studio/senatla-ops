import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then( m => m.LandingComponent)
  },
  {
    path: 'site-manager',
    loadComponent: () => import('./pages/site-manager/site-manager.component').then( m => m.SiteManagerComponent)
  },
  {
    path: 'office-admin',
    loadComponent: () => import('./pages/office-admin/office-admin.component').then( m => m.OfficeAdminComponent)
  },
  {
    path: 'director',
    loadComponent: () => import('./pages/director/director.component').then( m => m.DirectorComponent)
  },
];