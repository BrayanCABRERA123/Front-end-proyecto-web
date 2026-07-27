import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QualificationsViewModel } from './qualifications.viewmodel';

@Component({
  selector: 'app-qualifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    QualificationStatsComponent,
    QualificationCardComponent,
    MatIconModule,
    TranslateModule
  ],
  providers: [QualificationsViewModel],
  templateUrl: './qualifications.html',
  styleUrl: './qualifications.scss'
})
export class QualificationsComponent implements OnInit {

  // filtros de búsqueda
  filtroFecha: string = '';
  filtroTipoServicio: string = '';
  filtroEstrellas: string = '';

  // opciones de los selects
  tiposServicio = [
    { value: '', label: 'QUALIFICATIONS.TYPE_ALL' },
    { value: 'basico',   label: 'QUALIFICATIONS.TYPE_BASIC' },
    { value: 'premium',  label: 'QUALIFICATIONS.TYPE_PREMIUM' },
    { value: 'completo', label: 'QUALIFICATIONS.TYPE_FULL' }
  ];

  estrellas = [
    { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
    { value: '5', label: 'QUALIFICATIONS.STARS_5' },
    { value: '4', label: 'QUALIFICATIONS.STARS_4' },
    { value: '3', label: 'QUALIFICATIONS.STARS_3' },
    { value: '2', label: 'QUALIFICATIONS.STARS_2' },
    { value: '1', label: 'QUALIFICATIONS.STARS_1' }
  ];

  constructor(public vm: QualificationsViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }

  // filtra las calificaciones según los filtros activos
  get calificacionesFiltradas() {
    return this.vm.calificaciones().filter(c => {
      if (this.filtroEstrellas && c.estrellas !== parseInt(this.filtroEstrellas)) return false;
      if (this.filtroTipoServicio && c.tipoServicio.toLowerCase().includes(this.filtroTipoServicio) === false) return false;
      return true;
    });
  }

  // genera un arreglo de estrellas para mostrar en el template
  getEstrellas(cantidad: number): number[] {
    return Array(5).fill(0).map((_, i) => i < cantidad ? 1 : 0);
  }
}