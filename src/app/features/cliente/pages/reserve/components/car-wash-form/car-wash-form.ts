import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceModal } from '../../../../../../shared/components/service-modal/service-modal'; // importamos el componente
// iconos de Material que usa tu compañero
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, ServiceModal],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  // datos del formulario
  fecha: string = '';
  hora: string = '';
  minDate: string = '';
  maxDate: string = '';
  horasDisponibles: string[] = [];
  direccion: string = '';
  tipoVehiculo: string = '';
  tipoServicio: string = '';
  mostrarModal: boolean = false;

  // asignación de operario — 'automatica' o 'manual'
  asignacion: string = 'AUTO';
  operarioSeleccionado: string = '';

  // método de pago seleccionado
  metodoPago: string = '';

  // opciones del select de vehículos
  vehiculos = [
    { value: 'SEDAN' },
    { value: 'SUV' },
    { value: 'PICKUP' },
    { value: 'MOTO' }
  ];

  // opciones del select de servicios
  servicios = [
    { value: 'BASIC' },
    { value: 'FULL' },
    { value: 'PREMIUM' }
  ];

  // opciones del select de operarios
  operarios = [
    { value: 'op1', label: 'Carlos López' },
    { value: 'op2', label: 'María García' },
    { value: 'op3', label: 'Pedro Martínez' }
  ];

  // métodos de pago
  metodosPago = [
    { value: 'PSE', icono: 'account_balance' },
    { value: 'CARD', icono: 'credit_card' },
    { value: 'NEQUI', icono: 'smartphone' },
    { value: 'CASH', icono: 'payments' }
  ];

  // se ejecuta cuando hace clic en "Reservar Ahora"
  onSubmit(): void {
    console.log('Reserva enviada');
  }

  abrirModalServicio(): void {

    if (this.tipoServicio) {

      this.mostrarModal = true;

    }

  }

  ngOnInit(): void {

    const hoy = new Date();

    // fecha mínima = hoy
    this.minDate = hoy.toISOString().split('T')[0];

    // fecha máxima = hoy + 30 días
    const max = new Date();
    max.setDate(hoy.getDate() + 60);

    this.maxDate = max.toISOString().split('T')[0];

    this.generarHoras();

  }
  generarHoras(): void {

    this.horasDisponibles = [];

    // mañana → 08:00 a 12:00
    for (let h = 8; h <= 12; h++) {

      this.horasDisponibles.push(
        h.toString().padStart(2, '0') + ':00'
      );

    }

    // tarde → 13:00 a 18:00
    for (let h = 13; h <= 18; h++) {

      this.horasDisponibles.push(
        h.toString().padStart(2, '0') + ':00'
      );

    }

  }
}