import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Ruta raíz redirige al login
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    // Carga el módulo de auth
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth/auth-module')
      .then(m => m.AuthModule)
  }
];