import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Api } from '../../../../core/services/api';


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
  templateUrl: './qualifications.html',
  styleUrl: './qualifications.scss'
})
export class QualificationsComponent implements OnInit {

  private readonly operatorId = 1;

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

  // lista de calificaciones recibidas (viene de la API mock)
  calificaciones: any[] = [];

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getOperatorQualifications(this.operatorId).subscribe(calificaciones => {
      this.calificaciones = calificaciones;
      this.cdr.detectChanges();
    });
  }

  // estadísticas generales, derivadas de las calificaciones cargadas
  get totalCalificaciones(): number {
    return this.calificaciones.length;
  }

  get calificacionPromedio(): number {
    if (this.calificaciones.length === 0) return 0;
    const suma = this.calificaciones.reduce((sum, c) => sum + c.estrellas, 0);
    return Math.round((suma / this.calificaciones.length) * 10) / 10;
  }

  get porcentajeSatisfaccion(): number {
    if (this.calificaciones.length === 0) return 0;
    const positivas = this.calificaciones.filter(c => c.estrellas >= 4).length;
    return Math.round((positivas / this.calificaciones.length) * 100);
  }

  get nivelSatisfaccion(): string {
    if (this.porcentajeSatisfaccion >= 80) return 'Muy alto';
    if (this.porcentajeSatisfaccion >= 60) return 'Alto';
    if (this.porcentajeSatisfaccion >= 40) return 'Medio';
    return 'Bajo';
  }

  // filtra las calificaciones según los filtros activos
  get calificacionesFiltradas() {
    return this.calificaciones.filter(c => {
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