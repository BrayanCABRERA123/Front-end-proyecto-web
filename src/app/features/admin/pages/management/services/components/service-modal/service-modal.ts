// modal para agregar un nuevo servicio
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export type CategoriaServicio = 'LAVADO' | 'BRILLADO';

export interface NuevoServicio {
  nombre: string;
  precio: number;
  descripcion: string;
  duracion: number;
  categoria: CategoriaServicio;
  estado: 'ACTIVO' | 'INACTIVO';
}

@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './service-modal.html',
  styleUrls: ['./service-modal.scss']
})
export class ServiceModalComponent {
  @Input() abierto = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregarServicio = new EventEmitter<NuevoServicio>();

  nombre = '';
  precio: number | null = null;
  descripcion = '';
  duracion = 30;
  categoria: CategoriaServicio = 'LAVADO';
  activo = true;

  cerrarModal(): void {
    this.cerrar.emit();
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) { return; }

    this.agregarServicio.emit({
      nombre: this.nombre,
      precio: this.precio ?? 0,
      descripcion: this.descripcion,
      duracion: this.duracion,
      categoria: this.categoria,
      estado: this.activo ? 'ACTIVO' : 'INACTIVO'
    });

    this.resetForm(form);
  }

  private resetForm(form: NgForm): void {
    form.resetForm({ nombre: '', precio: null, descripcion: '', duracion: 30, categoria: 'LAVADO', activo: true });
  }
}
