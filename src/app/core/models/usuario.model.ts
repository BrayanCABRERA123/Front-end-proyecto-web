export type RolUsuario = 'CLIENTE' | 'OPERARIO' | 'ADMIN';

export interface Usuario {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  miembroDesde: string;
  rol?: RolUsuario;
}

// las iniciales se derivan del nombre, no se guardan como dato aparte
export function obtenerIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(palabra => palabra[0].toUpperCase())
    .join('');
}
