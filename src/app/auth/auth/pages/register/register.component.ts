// definimos el componente
import { Component } from '@angular/core';
// sirve para usar cosas basicas de HTML
import { CommonModule } from '@angular/common';
// nos sirve para crear el formulario y sus validaciones
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// para navegar entre pantallas
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent {

  registerForm: FormGroup;
  mostrarContrasena: boolean = false;
  mostrarConfirmar:  boolean = false;
  cargando:          boolean = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      nombre:     ['', [Validators.required, Validators.minLength(3)]],
      correo:     ['', [Validators.required, Validators.email]],
      telefono:   ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar:  ['', [Validators.required]]
    });
  }

  // nos permite acceder a los campos de html
  get f() {
    return this.registerForm.controls;
  }

  // Verifica si las dos contraseñas son iguales
  get contrasenasCoinciden(): boolean {
    return this.f['contrasena'].value === this.f['confirmar'].value;
  }

  // Se ejecuta cuando el usuario hace clic en "Registrarse"
  onSubmit() {
    if (this.registerForm.invalid || !this.contrasenasCoinciden) return;
    this.cargando = true;
    setTimeout(() => {
      this.cargando = false;
      this.router.navigate(['/auth/login']);
    }, 1500);
  }

  toggleContrasena() { this.mostrarContrasena = !this.mostrarContrasena; }
  toggleConfirmar()  { this.mostrarConfirmar  = !this.mostrarConfirmar;  }
}