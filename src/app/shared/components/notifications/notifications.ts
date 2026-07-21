import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent {

  @Input() rol: 'CLIENTE' | 'OPERARIO' = 'CLIENTE';

  @Input() notifications: any[] = [];

  filtroFecha = '';
  filtroTipoServicio = '';
  filtroVehiculo = '';

  tiposServicio = [
    { value: '', label: 'ASSIGNED_SERVICES.FILTERS.ALL' },
    { value: 'premium', label: 'SERVICE.PREMIUM' },
    { value: 'basico', label: 'SERVICE.BASIC' }
  ];

  resetFiltros() {
    this.filtroFecha = '';
    this.filtroTipoServicio = '';
    this.filtroVehiculo = '';
  }

}