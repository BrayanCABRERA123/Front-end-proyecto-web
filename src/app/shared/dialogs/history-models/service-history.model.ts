export type EstadoHistorial = 'finalizado' | 'cancelado' | 'reasignado';

export interface ServicioHistorial {
  id: number;
  codigo: string;
  fecha: string;
  hora: string;
  servicio: string;
  vehiculo: string;
  placa: string;
  cliente: string;
  direccion: string;
  metodoPago: string;
  monto: number;
  calificacion: number | null;
  comentario: string | null;
  estado: EstadoHistorial;
  motivo: string | null;
}

export function claseEstadoHistorial(estado: EstadoHistorial): string {
  if (estado === 'finalizado') return 'estado-finalizado';
  if (estado === 'cancelado') return 'estado-cancelado';
  return 'estado-reasignado';
}

export function iconoEstadoHistorial(estado: EstadoHistorial): string {
  if (estado === 'finalizado') return 'check_circle';
  if (estado === 'cancelado') return 'cancel';
  return 'sync_alt';
}

export function labelEstadoHistorial(estado: EstadoHistorial): string {
  return 'SERVICE_HISTORY.STATUS.' + estado.toUpperCase();
}