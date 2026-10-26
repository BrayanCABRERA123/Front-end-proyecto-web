// contratos del booking-service (catálogo, horario, bahías y reservas). Ver su README.
// fechas "aaaa-mm-dd" y horas "HH:mm" en la hora del lavadero (el backend ya las convierte).

export type BookingStatusCode = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type BayStatusCode = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
// cómo dijo el cliente que va a pagar: DIGITAL (QR + comprobante) o CASH (en el lavadero)
export type BookingPaymentMode = 'DIGITAL' | 'CASH';

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

// reservas del día frente al día anterior (booking-service, fecha del lavadero)
export interface DaySummaryResponse {
  date: string;
  bookings: number;
  previousDayBookings: number;
  difference: number;
}

export interface EstablishmentResponse {
  tradeName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  supportLine: string | null;
  serviceHoursNote: string | null;
}

// todos los datos del negocio (Configuración del admin); vacío viaja como null
export interface BusinessDataDto {
  tradeName: string | null;
  legalName: string;
  taxId: string;
  businessType: string | null;
  foundedOn: string | null;   // yyyy-MM-dd
  legalRepresentative: string | null;
  legalRepresentativeDocument: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxRegime: string | null;
  ciiuActivity: string | null;
  dianResolution: string | null;
  invoicePrefix: string | null;
  invoiceRange: string | null;
  instagram: string | null;
  facebook: string | null;
  supportLine: string | null;
  serviceHoursNote: string | null;
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
  // null en las reservas del admin y en las anteriores al cambio del 26-10
  paymentMode?: BookingPaymentMode | null;
  // instante ISO-8601 hasta el que hay que subir el comprobante (solo DIGITAL); vencido, se cancela
  paymentDeadline?: string | null;
  // el cliente ya subió el comprobante (o el pago ya está aprobado)
  paymentReported?: boolean;
}

export interface CreateBookingRequest {
  vehicleId: number;
  serviceIds: number[];
  date: string;
  time: string;
  notes?: string | null;
  // RF-010: operario que eligió el cliente (opcional); si no está libre, se asigna otro
  preferredOperatorId?: number | null;
  // obligatorio para el cliente (400 INVALID_PAYMENT_MODE si falta)
  paymentMode?: BookingPaymentMode | null;
}

export interface RescheduleBookingRequest {
  serviceIds?: number[];
  date: string;
  time: string;
  notes?: string | null;
}

// 409 SLOT_UNAVAILABLE trae hasta 5 horas libres del mismo día (RF-006) y el motivo
export interface SlotUnavailableProblem {
  code: 'SLOT_UNAVAILABLE';
  alternatives: string[];
  reason?: 'CLOSED_DAY' | 'OUTSIDE_HOURS' | 'TIME_PASSED' | 'NO_FREE_BAY';
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
