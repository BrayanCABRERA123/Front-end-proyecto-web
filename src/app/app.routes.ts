import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/pages/landing')
      .then(c => c.LandingComponent)
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule)
  },
  // cada área exige sesión y el rol correspondiente (ver core/guards/auth-guard)
  {
    path: 'client',
    canActivate: [authGuard],
    data: { roles: ['CLIENT'] },
    loadChildren: () =>
      import('./features/client/client-module')
        .then(m => m.ClientModule)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./features/admin/admin-module')
        .then(m => m.AdminModule)
  },
  {
    path: 'operator',
    canActivate: [authGuard],
    data: { roles: ['OPERATOR'] },
    loadChildren: () =>
      import('./features/operator/operator-module')
        .then(m => m.OperatorModule)
  }
];
