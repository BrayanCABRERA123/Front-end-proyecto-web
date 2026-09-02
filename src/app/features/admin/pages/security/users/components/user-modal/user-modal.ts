// modal para crear un nuevo usuario
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// tipos de usuario soportados (coinciden con los roles del sistema)
export type TipoUsuario = 'ADMIN' | 'OPERATOR' | 'SUPERVISOR';

// forma de los datos que emite el modal al crear un usuario
export interface NuevoUsuario {
  nombre: string;
  correo: string;
  tipoUsuario: TipoUsuario;
  invitar: boolean;
}

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './user-modal.html',
  styleUrl: './user-modal.scss'
})
export class UserModalComponent {
  @Input() abierto = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() crearUsuario = new EventEmitter<NuevoUsuario>();

  readonly tipos: { value: TipoUsuario; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'OPERATOR', label: 'Operador' },
    { value: 'SUPERVISOR', label: 'Supervisor' }
  ];

  form: NuevoUsuario = this.formVacio();

  private formVacio(): NuevoUsuario {
    return { nombre: '', correo: '', tipoUsuario: 'OPERATOR', invitar: true };
  }

  // cierra el modal sin guardar y resetea el formulario
  onCancelar(): void {
    this.form = this.formVacio();
    this.cerrar.emit();
  }

  // valida y emite el nuevo usuario
  onSubmit(ngForm: NgForm): void {
    if (ngForm.invalid) {
      Object.values(ngForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    this.crearUsuario.emit({ ...this.form });
    this.form = this.formVacio();
    ngForm.resetForm({ tipoUsuario: 'OPERATOR', invitar: true });
  }

  // cierra al hacer click fuera de la tarjeta
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancelar();
    }
  }
}
