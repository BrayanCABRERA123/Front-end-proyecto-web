import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { BookingApiService } from '../../../../core/services/booking-api';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent implements OnInit {

  private readonly bookingApi = inject(BookingApiService);

  // correo y teléfono del negocio que el admin guarda en Configuración (booking-service);
  // la app es zoneless: los signals refrescan la vista cuando llega la respuesta
  private readonly email = signal('—');
  private readonly phone = signal('—');

  // tarjetas de información de contacto
  readonly contactCards = computed(() => [
    { icon: 'mail', labelKey: 'CONTACT.EMAIL_LABEL', value: this.email() },
    { icon: 'call', labelKey: 'CONTACT.PHONE_LABEL', value: this.phone() },
    { icon: 'public', labelKey: 'CONTACT.COVERAGE_LABEL', valueKey: 'CONTACT.COVERAGE_VALUE' }
  ]);

  ngOnInit(): void {
    this.bookingApi.establishment().subscribe({
      next: (business) => {
        this.email.set(business.email || '—');
        this.phone.set(business.phone || business.supportLine || '—');
      },
      error: () => undefined // sin backend las tarjetas quedan con '—'
    });
  }
}
