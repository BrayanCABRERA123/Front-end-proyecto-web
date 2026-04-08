import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// iconos de Material que usa tu compañero
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
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
  asignacion: string = 'automatica';
  operarioSeleccionado: string = '';

  // método de pago seleccionado
  metodoPago: string = '';

  // opciones del select de vehículos
  vehiculos = [
    { value: 'sedan',  label: 'Sedán' },
    { value: 'suv',    label: 'SUV' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'moto',   label: 'Moto' }
  ];

  // opciones del select de servicios
  servicios = [
    { value: 'basico',   label: 'Básico' },
    { value: 'completo', label: 'Completo' },
    { value: 'premium',  label: 'Premium' }
  ];

  // opciones del select de operarios
  operarios = [
    { value: 'op1', label: 'Carlos López' },
    { value: 'op2', label: 'María García' },
    { value: 'op3', label: 'Pedro Martínez' }
  ];

  // métodos de pago con sus íconos de Material
  metodosPago = [
    { value: 'pse',      label: 'PSE',                      icono: 'account_balance' },
    { value: 'tarjeta',  label: 'Tarjeta Bancaria',          icono: 'credit_card' },
    { value: 'nequi',    label: 'Nequi',                     icono: 'smartphone' },
    { value: 'efectivo', label: 'Pagar en Físico (Efectivo)', icono: 'payments' }
  ];

  // se ejecuta cuando hace clic en "Reservar Ahora"
  onSubmit(): void {
    console.log('Reserva enviada');
  }
}