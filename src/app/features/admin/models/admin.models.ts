
/* ================= OPERARIOS ================= */

export type OperatorStatus = 'available' | 'in_service' | 'medical_leave';

export interface TodayService {
  code: string;
  vehicle: string;
  service: string;
  bay: string;
  time: string;
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface Certification {
  name: string;
  level: string;
}

export type CalendarBlockType = 'available' | 'service' | 'leave' | 'lunch';

export interface CalendarBlock {
  day: number; // 0 = lunes ... 5 = sábado
  startTime: string;
  endTime: string;
  type: CalendarBlockType;
  label: string;
  bay?: string;
}

/** tramo de disponibilidad semanal: day 0 = lunes ... 6 = domingo */
export interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
}

/** ausencia registrada por el administrador */
export interface Absence {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface Operator {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  status: OperatorStatus;
  bay: string | null;
  weeklyServices: number;
  weeklyServicesChange: number;
  tags: string[];
  featured?: boolean;
  phone: string;
  email: string;
  availableHours: number;
  totalHours: number;
  punctuality: number;
  weeklyRevenue: number;
  weeklyGoalPercent: number;
  certifications: Certification[];
  todayServices: TodayService[];
  calendarBlocks: CalendarBlock[];
  availability: AvailabilitySlot[];
  absences: Absence[];
}

/* ================= HORARIOS Y BAHÍAS ================= */

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type PauseType = 'none' | 'lunch';

export interface DaySchedule {
  key: DayKey;
  isWorking: boolean;
  openTime: string;
  closeTime: string;
  pause: PauseType;
  /** pausa del día ("HH:mm"); null si no tiene (ADR-010) */
  breakStart: string | null;
  breakEnd: string | null;
}

export type ScheduleExceptionType = 'holiday' | 'special';

export interface ScheduleException {
  id: string;
  date: string;
  type: ScheduleExceptionType;
  closedAllDay: boolean;
  openTime: string;
  closeTime: string;
  reason: string;
}

/** Estados permitidos para una bahía. Son los únicos tres que ofrece el select. */
export type BayStatus = 'active' | 'maintenance' | 'inactive';

/** el operario no va fijo en una bahía: se escoge por servicio (ADR-010) */
export interface WashBay {
  id: string;
  code: string;
  name: string;
  status: BayStatus;
}

/* ================= RESERVAS ================= */

// estados del booking-service (ADR-010) en minúscula, como los usan los estilos
export type BookingStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface AssignedOperator {
  id: string;
  initials: string;
  name: string;
}

export interface Booking {
  id: string;
  code: string;
  client: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  service: string;
  /** ids del catálogo, para reprogramar con los mismos servicios */
  serviceIds: number[];
  /** vehículo en customer-service */
  vehicleId: number | null;
  /** true si todavía se puede cambiar o cancelar (lo decide el backend, RF-007) */
  changeable: boolean;
  cancellationReason: string | null;
  /** fecha en formato ISO (yyyy-MM-dd) para poder filtrar de verdad */
  date: string;
  /** hora de inicio en formato 24h (HH:mm) */
  time: string;
  /** duración del servicio en minutos */
  durationMin: number;
  bay: string | null;
  status: BookingStatus;
  operator: AssignedOperator | null;
  notes: string;
  createdAt: string;
  amount: number;
}


/* ================= PAGOS ================= */

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: string;
  code: string;
  client: string;
  phone: string;
  reference: string;
  method: 'nequi' | 'bancolombia' | 'daviplata' | 'cash';
  amount: number;
  /** fecha ISO (yyyy-MM-dd) */
  date: string;
  time: string;
  service: string;
  status: PaymentStatus;
  rejectionReason?: string;

  // detalle extra que solo se usa al abrir el modal de revisión
  bookingCode: string;
  vehicle: string;
  plate: string;
  scheduleLabel: string;
  bay: string;
  operator: string;
  email: string;
  bankAccount: string;
  amountDeclared: number;
}

/* ================= GESTIÓN ================= */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  dateAdded: string;
  invited: boolean;
  status: 'active' | 'disabled';
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  /** llaves de permisos: 'view_panels' | 'create_records' | 'edit_data' | 'delete' */
  permissions: string[];
  usersCount: number;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  couponCode: string;
  redemptions: number;
  featured: boolean;
  icon: string;
  features: string[];
  status: 'active' | 'scheduled' | 'inactive';
  /** fecha ISO (yyyy-MM-dd) en que la promoción pasa a activa */
  startDate: string;
}

/* ================= CONFIGURACIÓN ================= */

export interface BusinessData {
  legalName: string;
  taxId: string;
  businessType: string;
  foundationDate: string;
  legalRep: string;
  legalRepDoc: string;

  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;

  taxRegime: string;
  ciiuActivity: string;
  dianResolution: string;
  invoicePrefix: string;
  invoiceRange: string;

  instagram: string;
  facebook: string;
  supportLine: string;
  serviceHours: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  holder: string;
  accountNumber: string;
  active: boolean;
  needsQr: boolean;
  qrFileName?: string;
}
