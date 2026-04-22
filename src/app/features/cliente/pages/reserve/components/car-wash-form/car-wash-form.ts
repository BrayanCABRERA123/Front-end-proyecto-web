import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// iconos de Material que usa tu compañero
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent {

  // datos del formulario
  fecha: string = '';
  hora: string = '';
  direccion: string = '';
  tipoVehiculo: string = '';
  tipoServicio: string = '';

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
}