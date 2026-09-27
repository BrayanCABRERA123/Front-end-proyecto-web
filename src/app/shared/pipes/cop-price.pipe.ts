import { Pipe, PipeTransform } from '@angular/core';

// muestra un valor en pesos colombianos con punto de miles (ej. 35000 -> "$35.000")
// el formato es siempre el colombiano porque el lavadero cobra en COP, sin importar el idioma
@Pipe({
  name: 'copPrice',
  standalone: true
})
export class CopPricePipe implements PipeTransform {

  transform(value: number | null | undefined): string {
    if (value == null) return '';
    return '$' + value.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }
}
