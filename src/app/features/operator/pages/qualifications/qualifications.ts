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

  // estadísticas generales
  calificacionPromedio: number = 4.3;
  nivelSatisfaccion: string = 'Muy alto';
  porcentajeSatisfaccion: number = 86;
  totalCalificaciones: number = 6;

  // lista de calificaciones recibidas
  calificaciones = [
    {
      id: 1,
      client: 'Carlos H.',
      tipoServicio: 'Lavado Premium',
      fecha: '15/07/2024',
      estrellas: 4,
      comentario: '"Excelente trabajo, llegó puntual y dejó el vehículo impecable."',
      duracion: '1h 30m',
      ubicacion: 'Miraflores',
      idServicio: 'SV-1234'
    },
    {
      id: 2,
      client: 'Ana M.',
      tipoServicio: 'Lavado Básico',
      fecha: '14/07/2024',
      estrellas: 5,
      comentario: '"Muy buen servicio, el auto quedó reluciente. Lo recomiendo totalmente."',
      duracion: '1h 0m',
      ubicacion: 'San Isidro',
      idServicio: 'SV-1233'
    },
    {
      id: 3,
      client: 'Pedro L.',
      tipoServicio: 'Lavado Completo',
      fecha: '12/07/2024',
      estrellas: 5,
      comentario: '"Increíble atención al detalle, superó mis expectativas."',
      duracion: '2h 0m',
      ubicacion: 'Surco',
      idServicio: 'SV-1230'
    },
    {
      id: 4,
      client: 'María G.',
      tipoServicio: 'Lavado Premium',
      fecha: '10/07/2024',
      estrellas: 3,
      comentario: '"Buen servicio pero llegó con un poco de retraso."',
      duracion: '1h 15m',
      ubicacion: 'La Molina',
      idServicio: 'SV-1228'
    },
    {
      id: 5,
      client: 'Jorge D.',
      tipoServicio: 'Lavado Básico',
      fecha: '08/07/2024',
      estrellas: 5,
      comentario: '"Rápido y eficiente. El auto quedó como nuevo."',
      duracion: '45m',
      ubicacion: 'Barranco',
      idServicio: 'SV-1225'
    },
    {
      id: 6,
      client: 'Sofía R.',
      tipoServicio: 'Lavado Completo',
      fecha: '05/07/2024',
      estrellas: 4,
      comentario: '"Muy buen trabajo en general, volveré a solicitar el servicio."',
      duracion: '1h 45m',
      ubicacion: 'Magdalena',
      idServicio: 'SV-1220'
    }
  ];

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