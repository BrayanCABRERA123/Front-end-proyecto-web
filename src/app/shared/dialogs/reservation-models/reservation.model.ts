export type EstadoReserva = 'finalizado' | 'en_progreso' | 'pendiente';

export interface Reserva {
  id: number;
  codigo: string;
  fecha: string;   
  hora: string;
  servicio: string;   
  cliente: string;
  vehiculo: string;   
  direccion: string;
  duracionMin: number;
  estado: EstadoReserva;
}

export function claseEstadoReserva(estado: EstadoReserva): string {
  if (estado === 'finalizado') return 'estado-finalizado';
  if (estado === 'en_progreso') return 'estado-progreso';
  return 'estado-pendiente';
}

export function iconoEstadoReserva(estado: EstadoReserva): string {
  if (estado === 'finalizado') return 'check_circle';
  if (estado === 'en_progreso') return 'play_circle';
  return 'schedule';
}

export function labelEstadoReserva(estado: EstadoReserva): string {
  return 'SCHEDULE.STATUS.' + estado.toUpperCase();
}

export function iconoVehiculoReserva(vehiculo: string): string {
  if (vehiculo === 'MOTO') return 'two_wheeler';
  if (vehiculo === 'TRUCK' || vehiculo === 'PICKUP') return 'local_shipping';
  return 'directions_car';
}