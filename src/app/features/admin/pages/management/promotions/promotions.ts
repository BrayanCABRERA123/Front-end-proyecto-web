// componente para gestionar promociones y descuentos
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface Promocion {
  id: number;
  descuento: number;
  fechaLimite: string;
  servicio: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './promotions.html',
  styleUrls: ['./promotions.scss']
})
export class PromotionsComponent {
  // lista de servicios disponibles para aplicar la promoción (ejemplo)
  serviciosDisponibles = ['Lavado básico', 'Encerado', 'Lavado completo', 'Pulido premium'];

  descuento: number | null = null;
  fechaLimite = '';
  servicioSeleccionado = '';

  promocionActiva: Promocion | null = {
    id: 1,
    descuento: 15,
    fechaLimite: '2026-05-30',
    servicio: 'Lavado completo'
  };

  crearPromocion(form: NgForm): void {
    if (form.invalid) { return; }

    this.promocionActiva = {
      id: Date.now(),
      descuento: this.descuento ?? 0,
      fechaLimite: this.fechaLimite,
      servicio: this.servicioSeleccionado
    };

    form.resetForm({ descuento: null, fechaLimite: '', servicioSeleccionado: '' });
  }
}
