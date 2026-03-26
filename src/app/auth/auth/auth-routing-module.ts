import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    // Ruta del login — página principal de auth
    path: '',
    loadComponent: () =>
      import('./pages/login/login')
      .then(c => c.LoginComponent)
  },
  {
    // Ruta de recuperar contraseña
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password')
      .then(c => c.ForgotPasswordComponent)
  },
  {
    // Ruta de registro
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component')
      .then(c => c.RegisterComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }