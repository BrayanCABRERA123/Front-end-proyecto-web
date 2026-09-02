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
  vehiculos = [
    { id: 1, tipo: 'SEDAN', marca: 'Mazda', modelo: '3 Sedán', placa: 'ABC-123' },
    { id: 2, tipo: 'MOTO', marca: 'Yamaha', modelo: 'FZ 2.0', placa: 'XYZ-98D' },
    { id: 3, tipo: 'TRUCK', marca: 'Toyota', modelo: 'Prado', placa: 'JKL-457' }
  ];

  // catálogo de servicios disponibles
  servicios = ['BASIC', 'PREMIUM', 'FULL'];
  servicioMasPopular = 'PREMIUM';

  // selección del usuario
  vehiculoSeleccionado: number | null = null;
  servicioSeleccionado: string = '';
  fecha: string = '';
  hora: string = '';
  direccion: string = '';

  // rango de fechas permitido
  minDate: string = '';
  maxDate: string = '';
  horasDisponibles: string[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];

    const max = new Date();
    max.setDate(hoy.getDate() + 60);
    this.maxDate = max.toISOString().split('T')[0];

    this.generarHoras();
  }

  generarHoras(): void {
    this.horasDisponibles = [];

    for (let h = 8; h <= 12; h++) {
      this.horasDisponibles.push(h.toString().padStart(2, '0') + ':00');
    }
    for (let h = 13; h <= 18; h++) {
      this.horasDisponibles.push(h.toString().padStart(2, '0') + ':00');
    }
  }

  seleccionarVehiculo(id: number) {
    this.vehiculoSeleccionado = id;
  }

  seleccionarServicio(servicio: string) {
    this.servicioSeleccionado = servicio;
  }

  get vehiculo() {
    return this.vehiculos.find(v => v.id === this.vehiculoSeleccionado) ?? null;
  }

  // extrae el valor numérico del precio del servicio (ej. "$35.000" -> 35000)
  get totalServicio(): number {
    if (!this.servicioSeleccionado) return 0;

    const clave = `SERVICE.${this.servicioSeleccionado}_PRICE`;
    const texto: string = this.translate.instant(clave);
    const numero = texto.replace(/[^0-9]/g, '');

    return numero ? parseInt(numero, 10) : 0;
  }

  get formularioValido(): boolean {
    return !!this.vehiculoSeleccionado && !!this.servicioSeleccionado && !!this.fecha && !!this.hora && !!this.direccion;
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    if (!this.formularioValido) return;

    // TODO: integrar con el backend de reservas
    console.log('Reserva enviada', {
      vehiculo: this.vehiculo,
      servicio: this.servicioSeleccionado,
      fecha: this.fecha,
      hora: this.hora,
      direccion: this.direccion,
      total: this.totalServicio
    });
  }

}
