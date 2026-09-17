import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// iconos de Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Api } from '../../../../../../core/services/api';
import { Auth } from '../../../../../../core/services/auth';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  // vehículos registrados del cliente logueado (viene de la API mock)
  vehiculos: any[] = [];

  enviando = false;
  reservaExitosa = false;
  reservaError = false;

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

  // id del cliente logueado; 2 (Juan Díaz) es el demo por defecto si nadie inició sesión
  private get userId(): number {
    return this.auth.getCurrentUser()?.id ?? 2;
  }

  constructor(
    private translate: TranslateService,
    private api: Api,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.minDate = hoy.toISOString().split('T')[0];

    const max = new Date();
    max.setDate(hoy.getDate() + 60);
    this.maxDate = max.toISOString().split('T')[0];

    this.generarHoras();

    this.api.getVehiclesByUser(this.userId).subscribe(vehiculos => {
      this.vehiculos = vehiculos;
      this.cdr.detectChanges();
    });
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
    if (!this.formularioValido || this.enviando) return;

    this.enviando = true;
    this.reservaExitosa = false;
    this.reservaError = false;

    const usuarioActual = this.auth.getCurrentUser();

    this.api.createReservation({
      codigo: `SV-${Date.now()}`,
      customerId: this.userId,
      cliente: usuarioActual?.nombre ?? 'Juan Díaz',
      vehiculo: this.vehiculo?.tipo ?? '',
      servicio: this.servicioSeleccionado,
      fecha: this.fecha,
      hora: this.hora,
      direccion: this.direccion,
      duracionMin: 30,
      estado: 'pendiente'
    }).subscribe({
      next: () => {
        this.enviando = false;
        this.reservaExitosa = true;
        this.router.navigate(['/client/history']);
      },
      error: () => {
        this.enviando = false;
        this.reservaError = true;
        this.cdr.detectChanges();
      }
    });
  }

}
