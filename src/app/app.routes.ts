import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // ruta raíz redirige al login
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    // carga el módulo de auth
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth/auth-module')
      .then(m => m.AuthModule)
  },
  {
    // carga el módulo del cliente
    path: 'cliente',
    loadChildren: () =>
      import('./modules/cliente/cliente/cliente-module')
      .then(m => m.ClienteModule)
  }
];