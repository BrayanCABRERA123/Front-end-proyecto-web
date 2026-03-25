import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'admin',
        loadChildren: () => import('./modules/admin/admin/admin-module').then(m => m.AdminModule)
    },
    {
        path: 'cliente',
        loadChildren: () => import('./modules/cliente/cliente/cliente-module').then(m => m.ClienteModule)
    },
    {
        path: 'operario',
        loadChildren: () => import('./modules/operario/operario/operario-module').then(m => m.OperarioModule)
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth/auth-module').then(m => m.AuthModule)
    },
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
    }
];