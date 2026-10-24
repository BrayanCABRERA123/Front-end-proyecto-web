import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import fr from '../../../assets/i18n/fr.json';
import pt from '../../../assets/i18n/pt.json';

// todas las llaves de un archivo de idioma, como "ADMIN_RESERVATIONS.REASSIGN"
function keysOf(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]);
}

describe('traducciones en los 4 idiomas', () => {
  it('en, fr y pt tienen las mismas llaves que es (nada sale sin traducir)', () => {
    const spanish = keysOf(es);
    for (const [lang, file] of Object.entries({ en, fr, pt })) {
      const own = new Set(keysOf(file));
      expect({ lang, missing: spanish.filter(key => !own.has(key)) }).toEqual({ lang, missing: [] });
    }
  });
});
