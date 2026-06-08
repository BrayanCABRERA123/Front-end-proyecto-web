import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';
import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    BackButtonComponent,
    AuthSidePanelComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})

export class LoginComponent {

  loginForm: FormGroup;

  mostrarContrasena = false;

  loginError = false;


  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    this.loginForm = this.fb.group({

      correo: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@gmail\.com$/)
        ]
      ],

      contrasena: [
        '',
        Validators.required
      ]

    });

  }


  get f() {
    return this.loginForm.controls;
  }


  toggleContrasena() {
    this.mostrarContrasena =
      !this.mostrarContrasena;
  }


  correoSinEspacios() {

    const correo =
      this.loginForm.get('correo');

    if (!correo) return;

    correo.setValue(
      correo.value.replace(/\s/g, ''),
      { emitEvent: false }
    );

  }


  onSubmit() {

    if (this.loginForm.invalid) return;

    const correo =
      this.loginForm.value.correo;

    const contrasena =
      this.loginForm.value.contrasena;


    // simulación backend temporal
    const usuarioDemo = {

      correo: 'admin@gmail.com',
      contrasena: 'Admin123!'

    };


    if (
      correo === usuarioDemo.correo &&
      contrasena === usuarioDemo.contrasena
    ) {

      this.loginError = false;

      this.router.navigate(['/cliente']);

    } else {

      this.loginError = true;

    }

  }

}