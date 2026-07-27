export type TipoAsignacion = 'MANUAL' | 'AUTO';
export type EstadoServicioHistorial = 'COMPLETED' | 'PENDING';

export interface ServicioHistorial {
  id: number;
  titulo: string;
  fecha: string;
  direccion: string;
  tipoServicio: string;
  serviciosExtra: string[];
  asignacionTipo: TipoAsignacion;
  operador: string;
  estado: EstadoServicioHistorial;
  precio: number;
  pagado: boolean;
}
