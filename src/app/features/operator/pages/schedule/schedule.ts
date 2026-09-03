import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import {
  Reserva,
  EstadoReserva,
  claseEstadoReserva,
  iconoEstadoReserva,
  labelEstadoReserva
} from '../../../../shared/dialogs/reservation-models/reservation.model';
import { MiniCalendarComponent } from './mini-calendar/mini-calendar';

type Tab = 'dia' | 'semana' | 'realizados';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, MiniCalendarComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent {

  tabActiva: Tab = 'dia';

  fechaSeleccionada = this.hoyComoTexto();

  reservas: Reserva[] = [
    { id: 1, codigo: 'SV-2098', fecha: '2026-08-31', hora: '09:00', servicio: 'BASIC', cliente: 'Mario Casas', vehiculo: 'CAR', direccion: 'Chapinero', duracionMin: 30, estado: 'finalizado' },
    { id: 2, codigo: 'SV-2099', fecha: '2026-08-31', hora: '15:00', servicio: 'FULL', cliente: 'Diana Ríos', vehiculo: 'SUV', direccion: 'Suba', duracionMin: 60, estado: 'finalizado' },

    { id: 3, codigo: 'SV-2100', fecha: '2026-09-01', hora: '11:00', servicio: 'PREMIUM', cliente: 'Felipe Cruz', vehiculo: 'CAR', direccion: 'Usaquén', duracionMin: 50, estado: 'finalizado' },

    { id: 4, codigo: 'SV-2101', fecha: '2026-09-02', hora: '08:00', servicio: 'PREMIUM', cliente: 'Carlos Méndez', vehiculo: 'CAR', direccion: 'Chapinero', duracionMin: 50, estado: 'finalizado' },
    { id: 5, codigo: 'SV-2102', fecha: '2026-09-02', hora: '10:00', servicio: 'BASIC', cliente: 'Ana Ruiz', vehiculo: 'MOTO', direccion: 'Usaquén', duracionMin: 25, estado: 'en_progreso' },
    { id: 6, codigo: 'SV-2103', fecha: '2026-09-02', hora: '13:30', servicio: 'FULL', cliente: 'Pedro López', vehiculo: 'PICKUP', direccion: 'Suba', duracionMin: 70, estado: 'pendiente' },
    { id: 7, codigo: 'SV-2104', fecha: '2026-09-02', hora: '16:00', servicio: 'PREMIUM', cliente: 'Sofía Herrera', vehiculo: 'CAR', direccion: 'Teusaquillo', duracionMin: 55, estado: 'pendiente' },

    { id: 8, codigo: 'SV-2105', fecha: '2026-09-03', hora: '09:30', servicio: 'BASIC', cliente: 'Julián Ortiz', vehiculo: 'MOTO', direccion: 'Engativá', duracionMin: 25, estado: 'pendiente' },
    { id: 9, codigo: 'SV-2106', fecha: '2026-09-03', hora: '14:00', servicio: 'PREMIUM', cliente: 'Laura Peña', vehiculo: 'CAR', direccion: 'Kennedy', duracionMin: 50, estado: 'pendiente' },

    { id: 10, codigo: 'SV-2107', fecha: '2026-09-04', hora: '10:00', servicio: 'FULL', cliente: 'Ricardo Nova', vehiculo: 'TRUCK', direccion: 'Fontibón', duracionMin: 70, estado: 'pendiente' },

    { id: 11, codigo: 'SV-2108', fecha: '2026-09-06', hora: '08:30', servicio: 'BASIC', cliente: 'Camila Torres', vehiculo: 'CAR', direccion: 'Chapinero', duracionMin: 30, estado: 'pendiente' }
  ];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  get serviciosPorFecha(): Record<string, number> {
    const mapa: Record<string, number> = {};
    for (const r of this.reservas) {
      mapa[r.fecha] = (mapa[r.fecha] ?? 0) + 1;
    }
    return mapa;
  }

  cambiarTab(tab: Tab) {
    this.tabActiva = tab;
  }

  onFechaSeleccionada(fecha: string) {
    this.fechaSeleccionada = fecha;
  }

  get reservasDelDia(): Reserva[] {
    return this.reservas
      .filter(r => r.fecha === this.fechaSeleccionada)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  get reservasDeLaSemana(): Reserva[] {
    const { inicio, fin } = this.rangoSemana(this.fechaSeleccionada);
    return this.reservas
      .filter(r => r.fecha >= inicio && r.fecha <= fin)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  get reservasRealizadas(): Reserva[] {
    return this.reservas
      .filter(r => r.estado === 'finalizado')
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  }

  get listaVisible(): Reserva[] {
    if (this.tabActiva === 'semana') return this.reservasDeLaSemana;
    if (this.tabActiva === 'realizados') return this.reservasRealizadas;
    return this.reservasDelDia;
  }

  get totalDelDia(): number {
    return this.reservasDelDia.length;
  }

  get pendientesDelDia(): number {
    return this.reservasDelDia.filter(r => r.estado === 'pendiente').length;
  }

  get enProgresoDelDia(): number {
    return this.reservasDelDia.filter(r => r.estado === 'en_progreso').length;
  }

  get finalizadosDelDia(): number {
    return this.reservasDelDia.filter(r => r.estado === 'finalizado').length;
  }

  get viendoHoy(): boolean {
    return this.fechaSeleccionada === this.hoyComoTexto();
  }

  get proximoServicio(): Reserva | null {
    if (!this.viendoHoy) return null;

    const ahora = new Date();
    const siguientes = this.reservasDelDia
      .filter(r => r.estado !== 'finalizado')
      .filter(r => new Date(`${r.fecha}T${r.hora}`).getTime() >= ahora.getTime())
      .sort((a, b) => a.hora.localeCompare(b.hora));

    return siguientes[0] ?? null;
  }

  get minutosParaElProximo(): number {
    if (!this.proximoServicio) return 0;
    const fechaHora = new Date(`${this.proximoServicio.fecha}T${this.proximoServicio.hora}`);
    return Math.max(0, Math.round((fechaHora.getTime() - Date.now()) / 60000));
  }

  claseEstado = claseEstadoReserva;
  iconoEstado = iconoEstadoReserva;
  labelEstado = labelEstadoReserva;

  iniciarServicio(r: Reserva) {
    if (r.estado !== 'pendiente') return;
    r.estado = 'en_progreso';
  }

  pedirFinalizar(r: Reserva) {
    const data: ConfirmModalData = {
      titulo: 'SCHEDULE.FINISH_TITLE',
      mensaje: 'SCHEDULE.FINISH_MESSAGE',
      textoConfirmar: 'SCHEDULE.FINISH_CONFIRM',
      textoCancelar: 'COMMON.CANCEL',
      peligro: false
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      r.estado = 'finalizado';

     
      this.cdr.detectChanges();
    });
  }

  verDetalle(r: Reserva) {
    const dialogRef = this.dialog.open(ReservationDetailModal, {
      panelClass: 'custom-dialog',
      data: r
    });

    dialogRef.afterClosed().subscribe(accion => {
      if (accion === 'iniciar') {
        this.iniciarServicio(r);
        this.cdr.detectChanges();
      } else if (accion === 'finalizar') {
        this.pedirFinalizar(r);
      }
    });
  }

  get fechaLegible(): string {
    const [, mes, dia] = this.fechaSeleccionada.split('-').map(Number);
    const meses: string[] = this.translate.instant('CALENDAR.MONTHS');
    return `${dia} ${this.translate.instant('SCHEDULE.OF')} ${meses[mes - 1]}`;
  }

  private hoyComoTexto(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private rangoSemana(fechaTexto: string): { inicio: string; fin: string } {
    const [anio, mes, dia] = fechaTexto.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    const offsetLunes = (fecha.getDay() + 6) % 7; // 0=lunes..6=domingo
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - offsetLunes);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const aTexto = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { inicio: aTexto(lunes), fin: aTexto(domingo) };
  }
}