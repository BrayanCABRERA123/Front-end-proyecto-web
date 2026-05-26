// definimos el componente
import { Component } from '@angular/core';

// sirve para usar cosas basicas de HTML
import { CommonModule } from '@angular/common';

// nos sirve para crear el formulario y sus validaciones
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

// para navegar entre pantallas
import { Router, RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})


export class RegisterComponent {

  registerForm: FormGroup;

  mostrarContrasena: boolean = false;
  mostrarConfirmar: boolean = false;
  cargando: boolean = false;
  loginError: boolean = false;


  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    this.registerForm = this.fb.group({

      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],

      correo: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@gmail\\.com$')
        ]
      ],

      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern('^3[0-9]{9}$'),
          Validators.minLength(10),
          Validators.maxLength(10)
        ]
      ],



      contrasena: [
        '',
        [
          Validators.required,
          Validators.pattern('^(?=.*[A-Z])(?=.*[0-9]).{8,}$')
        ]
      ],

      confirmar: [
        '',
        [
          Validators.required
        ]
      ]

    });

  }


  //Funcion para limpiar los espacios si el usuario pega correo.

  limpiarEspaciosCorreo() {

    const correo = this.registerForm.get('correo')?.value;

    if (!correo) return;

    this.registerForm
      .get('correo')
      ?.setValue(correo.replace(/\s/g, ''), { emitEvent: false });

  }

  // Funcion para que no se permita ingresar espacios en el correo
  bloquearEspacios(event: KeyboardEvent) {

    if (event.key === ' ') {
      event.preventDefault();
    }

  }

  limpiarTelefono() {

    let telefono = this.registerForm.get('telefono')?.value;

    if (!telefono) return;

    // elimina letras o símbolos
    telefono = telefono.replace(/\D/g, '');

    // obliga que empiece en 3
    if (telefono.length > 0 && telefono[0] !== '3') {
      telefono = telefono.substring(1);
    }

    // limita a 10 números
    telefono = telefono.substring(0, 10);

    this.registerForm
      .get('telefono')
      ?.setValue(telefono, { emitEvent: false });

  }


  // acceso rápido a los campos desde el HTML
  get f() {
    return this.registerForm.controls;
  }

  // Validar contraseña correcta
  get password(): string {
    return this.registerForm.get('contrasena')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
  }


  // validar que las contraseñas coincidan
  validarContrasenas() {

    const pass = this.registerForm.get('contrasena')?.value;
    const confirm = this.registerForm.get('confirmar')?.value;

    if (pass !== confirm) {

      this.registerForm
        .get('confirmar')
        ?.setErrors({ noCoincide: true });

    }

  }


  // se ejecuta cuando el usuario hace clic en "Registrarse"
  onSubmit() {

    this.validarContrasenas();

    if (this.registerForm.invalid) return;

    this.cargando = true;

    setTimeout(() => {

      this.cargando = false;

      // redirigir al login después del registro
      this.router.navigate(['/auth/login']);

    }, 1500);

  }


  // mostrar / ocultar contraseña
  toggleContrasena() {

    this.mostrarContrasena =
      !this.mostrarContrasena;

  }


  // mostrar / ocultar confirmar contraseña
  toggleConfirmar() {

    this.mostrarConfirmar =
      !this.mostrarConfirmar;

  }

}