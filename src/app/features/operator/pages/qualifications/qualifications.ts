import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
// calificaciones reales que dejaron los clientes (operations-service)
import { OperationsApiService, RatingResponse } from '../../../../core/services/operations-api';
import { isoToDisplayDate } from '../../../../core/utils/booking-display';

interface RatingCard {
  id: number;
  client: string;
  serviceType: string;
  date: string;
  isoDate: string;
  rating: number;
  comment: string;
  duration: string;
  serviceId: string;
}


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

  private readonly operations = inject(OperationsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // filtros de búsqueda
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  starsFilter: string = '';

  // opciones de los selects: los servicios que aparecen en sus calificaciones
  get serviceTypes(): { value: string; label: string }[] {
    const names = [...new Set(this.ratings.map(r => r.serviceType))];
    return [{ value: '', label: 'QUALIFICATIONS.TYPE_ALL' }, ...names.map(n => ({ value: n, label: n }))];
  }

starOptions = [
  { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
  { value: '5', label: 'QUALIFICATIONS.STARS_5' },
  { value: '4', label: 'QUALIFICATIONS.STARS_4' },
  { value: '3', label: 'QUALIFICATIONS.STARS_3' },
  { value: '2', label: 'QUALIFICATIONS.STARS_2' },
  { value: '1', label: 'QUALIFICATIONS.STARS_1' }
];

  // lista de calificaciones recibidas
  ratings: RatingCard[] = [];

  ngOnInit(): void {
    this.operations.myRatings().subscribe({
      next: list => {
        this.ratings = list.map(r => this.toCard(r));
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
  }

  // estadísticas generales (se calculan de la lista real)
  get totalRatings(): number {
    return this.ratings.length;
  }

  get averageRating(): number {
    if (this.ratings.length === 0) return 0;
    const avg = this.ratings.reduce((sum, r) => sum + r.rating, 0) / this.ratings.length;
    return Math.round(avg * 10) / 10;
  }

  // porcentaje de calificaciones de 4 o 5 estrellas
  get satisfactionPercentage(): number {
    if (this.ratings.length === 0) return 0;
    return Math.round((this.ratings.filter(r => r.rating >= 4).length / this.ratings.length) * 100);
  }

  get satisfactionLevel(): string {
    return this.ratings.length === 0 ? '—' : `${this.satisfactionPercentage}%`;
  }

  // filtra las calificaciones según los filtros activos
  get filteredRatings() {
    return this.ratings.filter(c => {
      if (this.starsFilter && c.rating !== parseInt(this.starsFilter)) return false;
      if (this.dateFilter && c.isoDate !== this.dateFilter) return false;
      if (this.serviceTypeFilter && c.serviceType !== this.serviceTypeFilter) return false;
      return true;
    });
  }

  // genera un arreglo de estrellas para mostrar en el template
  getStars(count: number): number[] {
    return Array(5).fill(0).map((_, i) => i < count ? 1 : 0);
  }

  private toCard(r: RatingResponse): RatingCard {
    return {
      id: r.bookingId,
      client: r.plate,
      serviceType: r.services,
      date: isoToDisplayDate(r.date),
      isoDate: r.date,
      rating: r.rating,
      comment: r.comment ?? '',
      duration: '',
      serviceId: r.bookingCode
    };
  }
}
