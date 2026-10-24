import { canStartNow, startHintKey } from './operator-work';

// ventana para iniciar un servicio: desde startableAt hasta startableUntil (operations-service)
describe('ventana de inicio del operario', () => {
  const minutes = (n: number) => new Date(Date.now() + n * 60_000).toISOString();

  it('se puede iniciar dentro de la ventana, o sin límites conocidos', () => {
    expect(canStartNow(minutes(-10), minutes(60))).toBe(true);
    expect(canStartNow(null, null)).toBe(true);
    // respuesta vieja sin startableUntil: solo cuenta el inicio
    expect(canStartNow(minutes(-10))).toBe(true);
  });

  it('antes de tiempo no deja y avisa desde qué hora', () => {
    expect(canStartNow(minutes(10), minutes(300))).toBe(false);
    expect(startHintKey(minutes(10), minutes(300))).toBe('OPERATOR_WORK.START_FROM');
  });

  it('pasado el límite (4 h después del fin) no deja y lo dice', () => {
    expect(canStartNow(minutes(-400), minutes(-5))).toBe(false);
    expect(startHintKey(minutes(-400), minutes(-5))).toBe('OPERATOR_WORK.START_TOO_LATE');
  });
});
