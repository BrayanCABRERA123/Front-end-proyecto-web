// componente del módulo operacional: disponibilidad y avance de operarios
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export type EstadoOperario = 'OCUPADO' | 'DISPONIBLE' | 'EN_RUTA';

export interface Operario {
  id: number;
  nombre: string;
  iniciales: string;
  zona: string;
  codigo: string;
  estado: EstadoOperario;
  asignados: number;
  completados: number;
  calificacion: number;
  avanceDia: number;
  cargaHoraria: number;
  libreDesde: string;
}

@Component({
  selector: 'app-operational',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './operational.html',
  styleUrls: ['./operational.scss']
})
export class OperationalComponent implements OnInit {
  busqueda = '';
  filtro = 'TODAS';

  // controla la animación: las barras arrancan en 0 y luego crecen al valor real
  barrasListas = false;

  operarios: Operario[] = [
    { id: 1, nombre: 'Juan Díaz', iniciales: 'JD', zona: 'Chapinero', codigo: 'OP-01', estado: 'OCUPADO', asignados: 6, completados: 4, calificacion: 4.9, avanceDia: 67, cargaHoraria: 79, libreDesde: '13:30' },
    { id: 2, nombre: 'Laura Gómez', iniciales: 'LG', zona: 'Usaquén', codigo: 'OP-02', estado: 'DISPONIBLE', asignados: 4, completados: 4, calificacion: 4.7, avanceDia: 100, cargaHoraria: 38, libreDesde: 'AHORA' },
    { id: 3, nombre: 'Miguel Rojas', iniciales: 'MR', zona: 'Suba', codigo: 'OP-03', estado: 'EN_RUTA', asignados: 5, completados: 3, calificacion: 4.5, avanceDia: 45, cargaHoraria: 60, libreDesde: '15:00' },
    { id: 4, nombre: 'Carolina Peña', iniciales: 'CP', zona: 'Kennedy', codigo: 'OP-04', estado: 'DISPONIBLE', asignados: 3, completados: 3, calificacion: 4.8, avanceDia: 100, cargaHoraria: 30, libreDesde: 'AHORA' }
  ];

  ngOnInit(): void {
    setTimeout(() => { this.barrasListas = true; }, 100);
  }

  get operariosFiltrados(): Operario[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.operarios.filter(op => {
      const coincideTexto = !texto || op.nombre.toLowerCase().includes(texto) || op.zona.toLowerCase().includes(texto);
      const coincideFiltro = this.filtro === 'TODAS' || op.estado === this.filtro;
      return coincideTexto && coincideFiltro;
    });
  }

  get totalDisponibles(): number {
    return this.operarios.filter(op => op.estado === 'DISPONIBLE').length;
  }

  get totalAsignadosHoy(): number {
    return this.operarios.reduce((acc, op) => acc + op.asignados, 0);
  }

  get totalCompletados(): number {
    return this.operarios.reduce((acc, op) => acc + op.completados, 0);
  }

  get calificacionPromedio(): string {
    if (!this.operarios.length) { return '0.0'; }
    const suma = this.operarios.reduce((acc, op) => acc + op.calificacion, 0);
    return (suma / this.operarios.length).toFixed(1);
  }

  verAgenda(operario: Operario): void {
    // TODO: abrir la agenda del operario
  }

  asignarServicio(operario: Operario): void {
    // TODO: abrir modal de asignación de servicio
  }
}
