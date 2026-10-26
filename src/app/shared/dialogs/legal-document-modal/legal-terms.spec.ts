import es from '../../../../assets/i18n/es.json';
import en from '../../../../assets/i18n/en.json';
import fr from '../../../../assets/i18n/fr.json';
import pt from '../../../../assets/i18n/pt.json';

// Términos y Condiciones: reglas del pago de la reserva (contrato del 26-10) en los 4 idiomas
describe('Términos: plazo del pago digital y límite del efectivo', () => {
  const files = { es, en, fr, pt };

  it('la sección de reservas explica el plazo de 30 minutos y el límite de una reserva en efectivo', () => {
    const expected = { es: ['30 minutos', 'una reserva activa'], en: ['30 minutes', 'one active booking'],
      fr: ['30 minutes', 'une seule réservation active'], pt: ['30 minutos', 'uma reserva ativa'] };
    for (const [lang, file] of Object.entries(files)) {
      const body = file.LEGAL.TERMS.SECTIONS[5].BODY;
      for (const text of expected[lang as keyof typeof expected]) expect({ lang, ok: body.includes(text) }).toEqual({ lang, ok: true });
    }
  });

  it('la sección de pagos ya no pone el efectivo como pago con QR y comprobante', () => {
    expect(es.LEGAL.TERMS.SECTIONS[6].BODY).not.toContain('(efectivo, Nequi');
    expect(es.LEGAL.TERMS.SECTIONS[6].BODY).toContain('lo registra el Administrador, sin comprobante');
    for (const file of Object.values(files)) {
      expect(file.LEGAL.TERMS.SECTIONS[6].BODY).toContain('QR');
    }
  });

  it('la fecha de actualización es la del 26 de octubre de 2026', () => {
    expect([es, en, fr, pt].map(f => f.LEGAL.LAST_UPDATED_DATE))
      .toEqual(['26 de octubre de 2026', 'October 26, 2026', '26 octobre 2026', '26 de outubro de 2026']);
  });
});
