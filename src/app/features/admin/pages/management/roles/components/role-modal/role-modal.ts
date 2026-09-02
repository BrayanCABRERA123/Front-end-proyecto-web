// modal para crear un nuevo rol
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// permisos disponibles para asignar a un rol
export type Permiso = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

// forma de los datos que emite el modal al crear un rol
export interface NuevoRol {
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './role-modal.html',
  styleUrl: './role-modal.scss'
})
export class RoleModalComponent {
  @Input() abierto = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() crearRol = new EventEmitter<NuevoRol>();

  readonly permisosDisponibles: { value: Permiso; label: string }[] = [
    { value: 'VIEW', label: 'Ver' },
    { value: 'CREATE', label: 'Crear' },
    { value: 'EDIT', label: 'Editar' },
    { value: 'DELETE', label: 'Eliminar' }
  ];

  nombre = '';
  descripcion = '';
  permisosSeleccionados: Permiso[] = [];

  // alterna la selección de un permiso en la lista
  togglePermiso(permiso: Permiso): void {
    if (this.permisosSeleccionados.includes(permiso)) {
      this.permisosSeleccionados = this.permisosSeleccionados.filter(p => p !== permiso);
    } else {
      this.permisosSeleccionados = [...this.permisosSeleccionados, permiso];
    }
  }

  private resetForm(): void {
    this.nombre = '';
    this.descripcion = '';
    this.permisosSeleccionados = [];
  }

  // cierra el modal sin guardar y resetea el formulario
  onCancelar(): void {
    this.resetForm();
    this.cerrar.emit();
  }

  // valida y emite el nuevo rol
  onSubmit(ngForm: NgForm): void {
    if (ngForm.invalid) {
      Object.values(ngForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    this.crearRol.emit({
      nombre: this.nombre,
      descripcion: this.descripcion,
      permisos: this.permisosSeleccionados
    });
    this.resetForm();
    ngForm.resetForm();
  }

  // cierra al hacer click fuera de la tarjeta
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancelar();
    }
  }
}
