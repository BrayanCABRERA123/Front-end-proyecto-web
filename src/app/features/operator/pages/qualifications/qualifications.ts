import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';


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
export class QualificationsComponent {

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

starOptions = [
  { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
  { value: '5', label: 'QUALIFICATIONS.STARS_5' },
  { value: '4', label: 'QUALIFICATIONS.STARS_4' },
  { value: '3', label: 'QUALIFICATIONS.STARS_3' },
  { value: '2', label: 'QUALIFICATIONS.STARS_2' },
  { value: '1', label: 'QUALIFICATIONS.STARS_1' }
];

  // estadísticas generales
  averageRating: number = 4.3;
  satisfactionLevel: string = 'Muy alto';
  satisfactionPercentage: number = 86;
  totalRatings: number = 6;

  // lista de calificaciones recibidas
  ratings = [
    {
      id: 1,
      client: 'Carlos H.',
      serviceType: 'Lavado Premium',
      date: '15/07/2024',
      rating: 4,
      comment: '"Excelente trabajo, llegó puntual y dejó el vehículo impecable."',
      duration: '1h 30m',
      location: 'Miraflores',
      serviceId: 'SV-1234'
    },
    {
      id: 2,
      client: 'Ana M.',
      serviceType: 'Lavado Básico',
      date: '14/07/2024',
      rating: 5,
      comment: '"Muy buen servicio, el auto quedó reluciente. Lo recomiendo totalmente."',
      duration: '1h 0m',
      location: 'San Isidro',
      serviceId: 'SV-1233'
    },
    {
      id: 3,
      client: 'Pedro L.',
      serviceType: 'Lavado Completo',
      date: '12/07/2024',
      rating: 5,
      comment: '"Increíble atención al detalle, superó mis expectativas."',
      duration: '2h 0m',
      location: 'Surco',
      serviceId: 'SV-1230'
    },
    {
      id: 4,
      client: 'María G.',
      serviceType: 'Lavado Premium',
      date: '10/07/2024',
      rating: 3,
      comment: '"Buen servicio pero llegó con un poco de retraso."',
      duration: '1h 15m',
      location: 'La Molina',
      serviceId: 'SV-1228'
    },
    {
      id: 5,
      client: 'Jorge D.',
      serviceType: 'Lavado Básico',
      date: '08/07/2024',
      rating: 5,
      comment: '"Rápido y eficiente. El auto quedó como nuevo."',
      duration: '45m',
      location: 'Barranco',
      serviceId: 'SV-1225'
    },
    {
      id: 6,
      client: 'Sofía R.',
      serviceType: 'Lavado Completo',
      date: '05/07/2024',
      rating: 4,
      comment: '"Muy buen trabajo en general, volveré a solicitar el servicio."',
      duration: '1h 45m',
      location: 'Magdalena',
      serviceId: 'SV-1220'
    }
  ];

  // filtra las calificaciones según los filtros activos
  get filteredRatings() {
    return this.ratings.filter(c => {
      if (this.starsFilter && c.rating !== parseInt(this.starsFilter)) return false;
      if (this.serviceTypeFilter && c.serviceType.toLowerCase().includes(this.serviceTypeFilter) === false) return false;
      return true;
    });
  }

  // genera un arreglo de estrellas para mostrar en el template
  getStars(count: number): number[] {
    return Array(5).fill(0).map((_, i) => i < count ? 1 : 0);
  }
}
