// definimos el componente
import { Component } from '@angular/core';

// sirve para usar cosas basicas de HTML
import { CommonModule } from '@angular/common';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';

import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';

// lista reutilizable de requisitos de la contraseña
import { PasswordRequirementsComponent } from '../../../../shared/components/password-requirements/password-requirements';

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

// modal reutilizable para mostrar Términos y Condiciones / Política de Datos
import { MatDialog } from '@angular/material/dialog';
import { LegalDocumentModal, LegalDocumentType } from '../../../../shared/dialogs/legal-document-modal/legal-document-modal';

// modal reutilizable para mostrar el mensaje de registro exitoso
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    BackButtonComponent,
    AuthSidePanelComponent,
    PasswordRequirementsComponent
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
    private router: Router,
    private dialog: MatDialog
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
      ],

      // el usuario debe aceptar explícitamente ambos documentos legales
      // (Ley 1581 de 2012 - Habeas Data: autorización previa, expresa e informada)
      aceptaTerminos: [false, Validators.requiredTrue],
      aceptaPoliticaDatos: [false, Validators.requiredTrue]

    });

  }


  // abre el modal con el documento legal solicitado.
  // si el usuario da "Aceptar" dentro del modal, marcamos la casilla
  // correspondiente automáticamente (evita que tenga que aceptar dos veces).
  verDocumentoLegal(tipo: LegalDocumentType, event?: Event) {

    event?.preventDefault();

    const dialogRef = this.dialog.open(LegalDocumentModal, {
      panelClass: 'custom-dialog',
      data: { type: tipo, mode: 'accept' }
    });

    dialogRef.afterClosed().subscribe((aceptado: boolean) => {

      if (!aceptado) return;

      const control = tipo === 'terms' ? 'aceptaTerminos' : 'aceptaPoliticaDatos';

      this.registerForm.get(control)?.setValue(true);
      this.registerForm.get(control)?.markAsTouched();
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

  // contraseña actual para la lista de requisitos (app-password-requirements)
  get password(): string {
    return this.registerForm.get('contrasena')?.value || '';
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

      this.mostrarRegistroExitoso();

    }, 1500);

  }


  // muestra el modal de registro exitoso y, al cerrarlo, redirige al login
  mostrarRegistroExitoso() {

    const data: StatusModalData = {
      title: 'REGISTER.SUCCESS_TITLE',
      message: 'REGISTER.SUCCESS_MESSAGE',
      buttonText: 'REGISTER.SUCCESS_BUTTON'
    };

    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // evita que se cierre al hacer clic afuera o con ESC, así el usuario
      // siempre pasa por el botón y se garantiza la redirección
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe(() => {
      // redirigir al login después del registro
      // (el login está en la ruta vacía del módulo auth, es decir "/auth")
      this.router.navigate(['/auth']);
    });

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