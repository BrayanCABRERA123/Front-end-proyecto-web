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
    path: 'cliente',
    loadChildren: () =>
      import('./features/cliente/cliente-module')
        .then(m => m.ClienteModule)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin-module')
        .then(m => m.AdminModule)
  },
  {
    path: 'operario',
    loadChildren: () =>
      import('./features/operario/operario-module')
        .then(m => m.OperarioModule)
  }
];