// componente para gestionar los servicios del negocio
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceModalComponent, NuevoServicio } from './components/service-modal/service-modal';

export type CategoriaServicio = 'LAVADO' | 'BRILLADO';
export type EstadoServicio = 'ACTIVO' | 'INACTIVO';

export interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  duracion: number;
  categoria: CategoriaServicio;
  estado: EstadoServicio;
  descripcion: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ServiceModalComponent],
  templateUrl: './services.html',
  styleUrls: ['./services.scss']
})
export class ServicesComponent {
  modalAbierto = false;

  // datos de ejemplo, luego se reemplazan por la respuesta del backend
  servicios: Servicio[] = [
    { id: 1, nombre: 'Lavado básico', precio: 80, duracion: 30, categoria: 'LAVADO', estado: 'ACTIVO', descripcion: '' },
    { id: 2, nombre: 'Encerado', precio: 150, duracion: 45, categoria: 'BRILLADO', estado: 'ACTIVO', descripcion: '' },
    { id: 3, nombre: 'Lavado completo', precio: 250, duracion: 60, categoria: 'LAVADO', estado: 'INACTIVO', descripcion: '' },
    { id: 4, nombre: 'Pulido premium', precio: 320, duracion: 90, categoria: 'BRILLADO', estado: 'ACTIVO', descripcion: '' }
  ];

  abrirModal(): void {
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  onAgregarServicio(nuevo: NuevoServicio): void {
    const id = this.servicios.length ? Math.max(...this.servicios.map(s => s.id)) + 1 : 1;
    this.servicios.push({ id, ...nuevo });
    this.modalAbierto = false;
  }

  // alterna el estado de un servicio entre activo e inactivo
  toggleEstadoServicio(servicio: Servicio): void {
    servicio.estado = servicio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  }

  editarServicio(servicio: Servicio): void {
    // TODO: conectar con endpoint de edición
  }

  eliminarServicio(servicio: Servicio): void {
    this.servicios = this.servicios.filter(s => s.id !== servicio.id);
  }
}
