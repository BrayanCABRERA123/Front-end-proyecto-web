import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HistoryCardComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent {

  constructor(private translate: TranslateService) {}

  // filtro activo
  activeFilter: string = 'todos';

  // fechas
  dateFrom: string = '';
  dateTo: string = '';

  // buscador
  search: string = '';

  showRatingModal = false;

  openRatingModal(): void {
    this.showRatingModal = true;
  }

  // SERVICIOS
  services = [
  {
    id: 1,
    title: 'PREMIUM',
    date: '28/03/2026',
    serviceType: 'PREMIUM',
    extras: ['WAX', 'VACUUM'],
    assignmentType: 'MANUAL',
    operator: 'Juan',
    status: 'COMPLETED',
    price: 35000,
    paid: true
  },
  {
    id: 2,
    title: 'BASIC',
    date: '16/12/2025',
    serviceType: 'BASIC',
    extras: ['WAX'],
    assignmentType: 'AUTO',
    operator: '',
    status: 'PENDING',
    price: 20000,
    paid: false
  }
];

  // TRADUCIR EXTRAS
  getTranslatedExtras(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('EXTRA.' + e));
  }

  // convierte "dd/mm/aaaa" a "aaaa-mm-dd" para compararla con los inputs de fecha
  private toIsoDate(date: string): string {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }

  // FILTRO COMPLETO
  get filteredServices() {
    return this.services.filter(service => {

      // filtro por estado
      if (this.activeFilter === 'pagados' && !service.paid) return false;
      if (this.activeFilter === 'pendientes' && service.paid) return false;

      // filtro por rango de fechas (los inputs dan "aaaa-mm-dd")
      const serviceDate = this.toIsoDate(service.date);
      if (this.dateFrom && serviceDate < this.dateFrom) return false;
      if (this.dateTo && serviceDate > this.dateTo) return false;

      // filtro por texto
      if (this.search) {
      const text = this.search.toLowerCase();

      return (
        this.translate.instant('SERVICE.' + service.serviceType)
          .toLowerCase()
          .includes(text) ||

        this.translate.instant('ASSIGNMENT.' + service.assignmentType)
          .toLowerCase()
          .includes(text) ||

        (service.operator &&
          service.operator.toLowerCase().includes(text))
      );
    }

    return true;
  });
  }
}
