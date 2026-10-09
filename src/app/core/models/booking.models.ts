// contratos del booking-service (catálogo, horario, bahías y reservas). Ver su README.
// fechas "aaaa-mm-dd" y horas "HH:mm" en la hora del lavadero (el backend ya las convierte).

export type BookingStatusCode = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type BayStatusCode = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface ServiceCategoryResponse {
  id: number;
  code: string;
  name: string;
}

// tarifa vigente de un tipo de vehículo (vehicleTypeId es el del customer-service)
export interface ServicePriceResponse {
  vehicleTypeId: number;
  price: number;
  estimatedMinutes: number;
  validFrom: string;
}

export interface CatalogServiceResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: ServiceCategoryResponse | null;
  active: boolean;
  prices: ServicePriceResponse[];
  // puntos de fidelización que gana el cliente cuando paga este servicio (0 = no suma)
  loyaltyPoints: number;
}

export interface ServicePriceRequest {
  vehicleTypeId: number;
  price: number;
  estimatedMinutes: number;
}

export interface CatalogServiceRequest {
  code?: string;
  name: string;
  description?: string | null;
  categoryId: number;
  prices: ServicePriceRequest[];
  // siempre se envía: si faltara, booking-service lo guardaría en 0 al editar
  loyaltyPoints: number;
}

// un día de la semana: 1 = lunes ... 7 = domingo
export interface BusinessHourDto {
  dayOfWeek: number;
  working: boolean;
  opensAt: string;
  closesAt: string;
  breakStartsAt: string | null;
  breakEndsAt: string | null;
}

export interface HoursExceptionResponse {
  id: number;
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  reason: string;
}

export interface HoursExceptionRequest {
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  reason: string;
}

export interface BayResponse {
  id: number;
  code: string;
  name: string;
  status: BayStatusCode;
}

export interface EstablishmentResponse {
  tradeName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
}

export interface AvailabilityResponse {
  date: string;
  open: boolean;
  durationMinutes: number;
  slots: { time: string; available: boolean }[];
}

export interface BookingVehicle {
  id: number;
  licensePlate: string;
  licensePlateFormatted: string;
  vehicleType: string;
  vehicleTypeName: string;
  brand: string | null;
  model: string | null;
}

export interface BookingLineResponse {
  serviceId: number;
  code: string;
  name: string;
  price: number;
  estimatedMinutes: number;
  quantity: number;
}

// la reserva como la responde el backend. changeable = si quien la ve todavía puede cambiarla
export interface BookingResponse {
  id: number;
  code: string;
  status: BookingStatusCode;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  scheduledStart: string;
  scheduledEnd: string;
  bay: BayResponse | null;
  vehicle: BookingVehicle | null;
  ownerUserId: number | null;
  bookedBy: number;
  services: BookingLineResponse[];
  subtotal: number;
  pointsDiscountAmount: number;
  total: number;
  cancellationReason: { code: string; name: string } | null;
  notes: string | null;
  changeable: boolean;
  createdAt: string | null;
}

export interface CreateBookingRequest {
  vehicleId: number;
  serviceIds: number[];
  date: string;
  time: string;
  notes?: string | null;
}

export interface RescheduleBookingRequest {
  serviceIds?: number[];
  date: string;
  time: string;
  notes?: string | null;
}

// 409 SLOT_UNAVAILABLE trae hasta 5 horas libres del mismo día (RF-006)
export interface SlotUnavailableProblem {
  code: 'SLOT_UNAVAILABLE';
  alternatives: string[];
}

// vehículo de cualquier cliente con su dueño (customer-service, solo admin)
export interface OwnedVehicleResponse {
  vehicle: {
    id: number;
    licensePlate: string;
    licensePlateFormatted: string;
    vehicleType: string;
    vehicleTypeId: number;
    vehicleTypeName: string;
    brand: string | null;
    model: string | null;
  };
  ownerUserId: number | null;
}
