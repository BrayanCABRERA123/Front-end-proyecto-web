import { Routes } from '@angular/router';

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
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule)
  },
  {
    path: 'client',
    loadChildren: () =>
      import('./features/client/client-module')
        .then(m => m.ClientModule)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin-module')
        .then(m => m.AdminModule)
  },
  {
    path: 'operator',
    loadChildren: () =>
      import('./features/operator/operator-module')
        .then(m => m.OperatorModule)
  }
];