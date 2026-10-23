import { assignActionOf } from './booking-assignment';

describe('assignActionOf (A-02)', () => {
  const operator = { id: '4', initials: 'OR', name: 'Oscar Ruiz' };

  it('sin operario ofrece asignar y con operario ofrece reasignar', () => {
    expect(assignActionOf({ changeable: true, status: 'confirmed', operator: null })).toBe('assign');
    expect(assignActionOf({ changeable: true, status: 'confirmed', operator })).toBe('reassign');
    expect(assignActionOf({ changeable: true, status: 'scheduled', operator })).toBe('reassign');
  });

  it('una reserva que ya empezó, terminó o no se puede cambiar no ofrece nada', () => {
    expect(assignActionOf({ changeable: false, status: 'confirmed', operator })).toBeNull();
    expect(assignActionOf({ changeable: true, status: 'in_progress', operator })).toBeNull();
    expect(assignActionOf({ changeable: true, status: 'completed', operator: null })).toBeNull();
  });
});
