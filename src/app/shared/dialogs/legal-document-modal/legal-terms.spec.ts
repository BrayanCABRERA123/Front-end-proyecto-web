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

  it('la sección de reservas habla de "el Cliente" en tercera persona, sin tuteo', () => {
    const body = es.LEGAL.TERMS.SECTIONS[5].BODY;
    expect(body).toContain('Si el Cliente elige pago digital, debe cargar el comprobante');
    expect(body).toContain('el Cliente puede tener como máximo una reserva activa');
    expect(body).not.toMatch(/\b(eliges|debes|puedes)\b/);
    expect(en.LEGAL.TERMS.SECTIONS[5].BODY).not.toContain('If you choose');
    expect(fr.LEGAL.TERMS.SECTIONS[5].BODY).not.toContain('vous');
    expect(pt.LEGAL.TERMS.SECTIONS[5].BODY).not.toContain('você');
  });

  it('la sección 8 explica el informe de inspección y sus fotografías, y las demás se renumeran', () => {
    for (const file of Object.values(files)) {
      const sections = file.LEGAL.TERMS.SECTIONS;
      expect(sections.length).toBe(16);
      sections.forEach((s, i) => expect(s.HEADING.startsWith(`${i + 1}.`)).toBe(true));
      expect(sections[7].BODY).toContain('JPEG');
      expect(sections[7].BODY).toContain('2 M');
    }
    expect(es.LEGAL.TERMS.SECTIONS[7].BODY).toContain('el enlace es personal y el Cliente no debe compartirlo');
  });

  it('la Política incluye las fotografías de la inspección sin inventar un plazo de conservación', () => {
    const privacy = es.LEGAL.PRIVACY.SECTIONS;
    expect(privacy[3].BODY).toContain('fotografías del vehículo tomadas durante la inspección');
    expect(privacy[4].BODY).toContain('atender reclamaciones por daños');
    expect(privacy[11].BODY).toContain('durante el tiempo necesario para atender reclamaciones sobre el servicio, conforme a esta política');
  });

  it('la fecha de actualización es la del 26 de octubre de 2026', () => {
    expect([es, en, fr, pt].map(f => f.LEGAL.LAST_UPDATED_DATE))
      .toEqual(['26 de octubre de 2026', 'October 26, 2026', '26 octobre 2026', '26 de outubro de 2026']);
  });
});
