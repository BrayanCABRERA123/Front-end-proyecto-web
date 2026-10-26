import { BusinessHourDto } from '../models/booking.models';
import { businessAddress, businessHoursSummary, businessName, paymentDeadlineTime } from './booking-display';

const DAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const label = (day: number) => DAYS[day];

function day(dayOfWeek: number, opensAt: string, closesAt: string, working = true): BusinessHourDto {
  return { dayOfWeek, working, opensAt, closesAt, breakStartsAt: null, breakEndsAt: null };
}

describe('businessHoursSummary', () => {
  it('junta los días seguidos con el mismo horario y separa los distintos', () => {
    const week = [
      day(6, '08:00:00', '14:00:00'),
      ...[1, 2, 3, 4, 5].map(d => day(d, '07:00:00', '18:30:00')),
      day(7, '08:00:00', '14:00:00', false),
    ];

    expect(businessHoursSummary(week, label)).toBe('Lunes - Viernes 07:00 - 18:30 · Sábado 08:00 - 14:00');
  });

  it('un día cerrado en medio corta el grupo', () => {
    const week = [day(1, '07:00', '18:00'), day(2, '07:00', '18:00', false), day(3, '07:00', '18:00')];

    expect(businessHoursSummary(week, label)).toBe('Lunes 07:00 - 18:00 · Miércoles 07:00 - 18:00');
  });

  it('sin días abiertos (o sin horario) no inventa uno', () => {
    expect(businessHoursSummary([], label)).toBe('—');
    expect(businessHoursSummary([day(1, '07:00', '18:00', false)], label)).toBe('—');
  });
});

describe('sede con datos vacíos', () => {
  it('sin nombre comercial ni dirección muestra un texto neutro en vez de un hueco', () => {
    expect(businessName({ tradeName: '  ' })).toBe('LavaRápido');
    expect(businessName(null)).toBe('LavaRápido');
    expect(businessAddress({ address: '' })).toBeNull();
    expect(businessName({ tradeName: 'Lavadero Centro' })).toBe('Lavadero Centro');
    expect(businessAddress({ address: ' Calle 10 # 5-20 ' })).toBe('Calle 10 # 5-20');
  });
});

describe('plazo del pago digital', () => {
  // 14:05 en la hora local del navegador, sin depender de su zona horaria
  const deadline = new Date(2099, 9, 23, 14, 5).toISOString();

  it('una reserva activa con plazo y sin comprobante muestra la hora local', () => {
    expect(paymentDeadlineTime({ status: 'SCHEDULED', paymentDeadline: deadline, paymentReported: false })).toBe('14:05');
  });

  it('sin plazo, con el comprobante reportado o ya no activa, no hay insignia', () => {
    expect(paymentDeadlineTime({ status: 'CONFIRMED', paymentDeadline: null, paymentReported: false })).toBeNull();
    expect(paymentDeadlineTime({ status: 'CONFIRMED', paymentDeadline: deadline, paymentReported: true })).toBeNull();
    expect(paymentDeadlineTime({ status: 'CANCELLED', paymentDeadline: deadline, paymentReported: false })).toBeNull();
    expect(paymentDeadlineTime({ status: 'COMPLETED', paymentDeadline: deadline })).toBeNull();
  });
});
