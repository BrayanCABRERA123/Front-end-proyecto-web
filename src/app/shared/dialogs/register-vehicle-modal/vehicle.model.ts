// tipos de vehículo disponibles (reutiliza las claves ya usadas en VEHICLE.*)
export type VehicleType = 'CAR' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK' | 'MOTO';

export const VEHICLE_TYPES: VehicleType[] = ['CAR', 'SEDAN', 'SUV', 'PICKUP', 'TRUCK', 'MOTO'];

// datos del vehículo que maneja el formulario
export interface VehicleFormValue {
  type: string;
  brand: string;
  model: string;
  plate: string;
  color: string;
}

// datos que recibe el modal
// vehicle: si viene, el modal abre en modo edición con esos datos
// takenPlates: placas ya registradas por el cliente (para no repetirlas)
export interface RegisterVehicleModalData {
  vehicle?: VehicleFormValue;
  takenPlates?: string[];
}

// formatos oficiales de placas en Colombia
// carros, camionetas y SUV: 3 letras + 3 números (ABC123)
// motos: 3 letras + 2 números + 1 letra (ABC12D)
const CAR_PLATE_REGEX = /^[A-Z]{3}[0-9]{3}$/;
const MOTO_PLATE_REGEX = /^[A-Z]{3}[0-9]{2}[A-Z]$/;

export const PLATE_LENGTH = 6;

export function isMoto(type: string): boolean {
  return type === 'MOTO';
}

// valida la placa según el tipo de vehículo
export function isValidPlate(plate: string, type: string): boolean {
  const regex = isMoto(type) ? MOTO_PLATE_REGEX : CAR_PLATE_REGEX;
  return regex.test(plate);
}

// deja la placa solo con letras y números en mayúscula (ej. "abc-123" -> "ABC123")
export function normalizePlate(plate: string): string {
  return (plate ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, PLATE_LENGTH);
}

// formato para mostrar y guardar (ej. "ABC123" -> "ABC-123")
export function formatPlate(plate: string): string {
  const clean = normalizePlate(plate);
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}
