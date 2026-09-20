import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// iconos de Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  // vehículos registrados del cliente (mismo mock que en Mis Vehículos)
  vehicles = [
    { id: 1, type: 'SEDAN', brand: 'Mazda', model: '3 Sedán', plate: 'ABC-123' },
    { id: 2, type: 'MOTO', brand: 'Yamaha', model: 'FZ 2.0', plate: 'XYZ-98D' },
    { id: 3, type: 'TRUCK', brand: 'Toyota', model: 'Prado', plate: 'JKL-457' }
  ];

  // catálogo de servicios disponibles
  services = ['BASIC', 'PREMIUM', 'FULL'];
  mostPopularService = 'PREMIUM';

  // selección del usuario
  selectedVehicleId: number | null = null;
  selectedService: string = '';
  date: string = '';
  time: string = '';
  address: string = '';

  // rango de fechas permitido
  minDate: string = '';
  maxDate: string = '';
  availableTimes: string[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const max = new Date();
    max.setDate(today.getDate() + 60);
    this.maxDate = max.toISOString().split('T')[0];

    this.generateTimes();
  }

  generateTimes(): void {
    this.availableTimes = [];

    for (let h = 8; h <= 12; h++) {
      this.availableTimes.push(h.toString().padStart(2, '0') + ':00');
    }
    for (let h = 13; h <= 18; h++) {
      this.availableTimes.push(h.toString().padStart(2, '0') + ':00');
    }
  }

  selectVehicle(id: number) {
    this.selectedVehicleId = id;
  }

  selectService(service: string) {
    this.selectedService = service;
  }

  get vehicle() {
    return this.vehicles.find(v => v.id === this.selectedVehicleId) ?? null;
  }

  // extrae el valor numérico del precio del servicio (ej. "$35.000" -> 35000)
  get serviceTotal(): number {
    if (!this.selectedService) return 0;

    const key = `SERVICE.${this.selectedService}_PRICE`;
    const text: string = this.translate.instant(key);
    const number = text.replace(/[^0-9]/g, '');

    return number ? parseInt(number, 10) : 0;
  }

  get isFormValid(): boolean {
    return !!this.selectedVehicleId && !!this.selectedService && !!this.date && !!this.time && !!this.address;
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    if (!this.isFormValid) return;

    // TODO: integrar con el backend de reservas
    console.log('Reserva enviada', {
      vehicle: this.vehicle,
      service: this.selectedService,
      date: this.date,
      time: this.time,
      address: this.address,
      total: this.serviceTotal
    });
  }

}
