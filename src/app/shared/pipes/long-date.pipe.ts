import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// fecha larga en el idioma elegido (ej. "lunes, 19 de octubre de 2026" / "Monday, October 19, 2026")
// es impuro para que cambie apenas la persona cambia de idioma
const LOCALES: Record<string, string> = { es: 'es-CO', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };

@Pipe({
  name: 'longDate',
  standalone: true,
  pure: false
})
export class LongDatePipe implements PipeTransform {

  private readonly translate = inject(TranslateService);

  transform(value: Date | string | null | undefined = new Date()): string {
    if (value == null) return '';
    const locale = LOCALES[this.translate.currentLang ?? 'es'] ?? 'es-CO';
    return new Date(value).toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}
