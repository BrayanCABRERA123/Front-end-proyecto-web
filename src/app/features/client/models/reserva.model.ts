export type TipoServicio = 'PREMIUM' | 'BASIC' | 'FULL_WASH';
export type EstadoReserva = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';

export interface ReservaProxima {
  tipo: string;
  vehiculo: string;
  fecha: string;
  estado: EstadoReserva;
}
