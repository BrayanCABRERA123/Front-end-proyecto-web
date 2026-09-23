import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Booking, BookingsService } from '../../../../core/services/bookings';

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
export class HistoryComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    private bookingsService: BookingsService,
    private cdr: ChangeDetectorRef
  ) {}

  // filtro activo
  activeFilter: string = 'todos';

  // fechas
  dateFrom: string = '';
  dateTo: string = '';

  // buscador
  search: string = '';

  // reservas del cliente (GET /me/bookings, más recientes primero)
  services: Booking[] = [];

  ngOnInit(): void {
    this.bookingsService.myBookings$().subscribe(bookings => {
      this.services = bookings;
      this.cdr.markForCheck();
    });
  }

  // la tarjeta avisa cuando el cliente calificó, para reflejar el cambio sin recargar
  onRated(updated: Booking): void {
    this.services = this.services.map(s => (s.id === updated.id ? updated : s));
    this.cdr.markForCheck();
  }

  // FILTRO COMPLETO
  get filteredServices(): Booking[] {
    return this.services.filter(service => {

      // filtro por estado de pago
      if (this.activeFilter === 'pagados' && !service.paid) return false;
      if (this.activeFilter === 'pendientes' && service.paid) return false;

      // filtro por rango de fechas (yyyy-mm-dd, igual que el <input type="date">)
      const day = service.scheduledStart.slice(0, 10);
      if (this.dateFrom && day < this.dateFrom) return false;
      if (this.dateTo && day > this.dateTo) return false;

      // filtro por texto
      if (this.search) {
        const text = this.search.toLowerCase();

        return (
          (service.address ?? '').toLowerCase().includes(text) ||
          service.code.toLowerCase().includes(text) ||
          (service.vehicle?.plate ?? '').toLowerCase().includes(text) ||
          service.services.some(s =>
            this.translate.instant('SERVICE.' + s.code).toLowerCase().includes(text)
          ) ||
          (service.operator ?? '').toLowerCase().includes(text)
        );
      }

      return true;
    });
  }
}
