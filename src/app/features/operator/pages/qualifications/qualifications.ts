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
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  starsFilter: string = '';

  // opciones de los selects
  serviceTypes = [
  { value: '', label: 'QUALIFICATIONS.TYPE_ALL' },
  { value: 'basico',   label: 'QUALIFICATIONS.TYPE_BASIC' },
  { value: 'premium',  label: 'QUALIFICATIONS.TYPE_PREMIUM' },
  { value: 'completo', label: 'QUALIFICATIONS.TYPE_FULL' }
];

starsOptions = [
  { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
  { value: '5', label: 'QUALIFICATIONS.STARS_5' },
  { value: '4', label: 'QUALIFICATIONS.STARS_4' },
  { value: '3', label: 'QUALIFICATIONS.STARS_3' },
  { value: '2', label: 'QUALIFICATIONS.STARS_2' },
  { value: '1', label: 'QUALIFICATIONS.STARS_1' }
];

  // lista de calificaciones recibidas (viene de la API mock)
  ratings: any[] = [];

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getOperatorQualifications(this.operatorId).subscribe(ratings => {
      this.ratings = ratings;
      this.cdr.detectChanges();
    });
  }

  // estadísticas generales, derivadas de las calificaciones cargadas
  get totalRatings(): number {
    return this.ratings.length;
  }

  get averageRating(): number {
    if (this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((total, r) => total + r.stars, 0);
    return Math.round((sum / this.ratings.length) * 10) / 10;
  }

  get satisfactionPercentage(): number {
    if (this.ratings.length === 0) return 0;
    const positive = this.ratings.filter(r => r.stars >= 4).length;
    return Math.round((positive / this.ratings.length) * 100);
  }

  get satisfactionLevel(): string {
    if (this.satisfactionPercentage >= 80) return 'Muy alto';
    if (this.satisfactionPercentage >= 60) return 'Alto';
    if (this.satisfactionPercentage >= 40) return 'Medio';
    return 'Bajo';
  }

  // filtra las calificaciones según los filtros activos
  get filteredRatings() {
    return this.ratings.filter(r => {
      if (this.starsFilter && r.stars !== parseInt(this.starsFilter)) return false;
      if (this.serviceTypeFilter && r.serviceType.toLowerCase().includes(this.serviceTypeFilter) === false) return false;
      return true;
    });
  }

  // genera un arreglo de estrellas para mostrar en el template
  getStars(count: number): number[] {
    return Array(5).fill(0).map((_, i) => i < count ? 1 : 0);
  }
}
