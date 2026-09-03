import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// una celda del calendario
interface DiaCalendario {
  fecha: string;        // 'AAAA-MM-DD'
  numero: number;       // dia del mes (1-31)
  delMesActual: boolean; // false = dia "relleno" de otro mes
  cantidadServicios: number;
  esHoy: boolean;
}

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './mini-calendar.html',
  styleUrl: './mini-calendar.scss'
})
export class MiniCalendarComponent implements OnChanges {

  // mapa 'AAAA-MM-DD' -> cuantos servicios hay ese dia
  @Input() serviciosPorFecha: Record<string, number> = {};
  @Input() fechaSeleccionada: string = '';

  @Output() fechaSeleccionadaChange = new EventEmitter<string>();

  // mes que se esta mostrando actualmente (siempre el dia 1 de ese mes)
  mesMostrado = new Date();

  semanas: DiaCalendario[][] = [];

  constructor(private translate: TranslateService) {}

  // nombre del mes mostrado, ej: 'Septiembre 2026'
  get tituloMes(): string {
    const meses: string[] = this.translate.instant('CALENDAR.MONTHS');
    const nombre = meses[this.mesMostrado.getMonth()];
    return `${nombre} ${this.mesMostrado.getFullYear()}`;
  }

  // encabezados de columna: Lun, Mar, Mie...
  get diasSemanaCortos(): string[] {
    return this.translate.instant('CALENDAR.DAYS_SHORT');
  }

  // como el input llega despues de crear el componente, generamos
  // el calendario cada vez que algo relevante cambie
  ngOnChanges(changes: SimpleChanges): void {
    // OJO: 'serviciosPorFecha' llega de un getter en el padre, que crea
    // un objeto nuevo en cada revision de Angular -> eso dispara ngOnChanges
    // todo el tiempo. Por eso solo reubicamos el mes cuando la fecha
    // seleccionada CAMBIO de verdad, para no pisar la navegacion manual
    // del usuario con los botones < >.
    if (changes['fechaSeleccionada'] && this.fechaSeleccionada) {
      const [anio, mes] = this.fechaSeleccionada.split('-').map(Number);
      this.mesMostrado = new Date(anio, mes - 1, 1);
    }
    this.generarCalendario();
  }

  mesAnterior() {
    this.mesMostrado = new Date(this.mesMostrado.getFullYear(), this.mesMostrado.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente() {
    this.mesMostrado = new Date(this.mesMostrado.getFullYear(), this.mesMostrado.getMonth() + 1, 1);
    this.generarCalendario();
  }

  seleccionarDia(dia: DiaCalendario) {
    if (!dia.delMesActual) return;
    this.fechaSeleccionadaChange.emit(dia.fecha);
  }

  // convierte una fecha real a texto 'AAAA-MM-DD' (sin usar toISOString,
  // que convierte a UTC y puede correr el dia segun la zona horaria)
  private aTextoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private generarCalendario() {
    const anio = this.mesMostrado.getFullYear();
    const mes = this.mesMostrado.getMonth();

    const hoyTexto = this.aTextoFecha(new Date());

    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    // getDay() da 0=domingo..6=sabado; convertimos a 0=lunes..6=domingo
    const offsetInicio = (primerDiaMes.getDay() + 6) % 7;

    // primer dia que se pinta en la grilla (puede ser del mes anterior)
    const inicioGrilla = new Date(anio, mes, 1 - offsetInicio);

    const totalCeldas = Math.ceil((offsetInicio + ultimoDiaMes.getDate()) / 7) * 7;

    const celdas: DiaCalendario[] = [];
    for (let i = 0; i < totalCeldas; i++) {
      const fecha = new Date(inicioGrilla.getFullYear(), inicioGrilla.getMonth(), inicioGrilla.getDate() + i);
      const fechaTexto = this.aTextoFecha(fecha);

      celdas.push({
        fecha: fechaTexto,
        numero: fecha.getDate(),
        delMesActual: fecha.getMonth() === mes,
        cantidadServicios: this.serviciosPorFecha[fechaTexto] ?? 0,
        esHoy: fechaTexto === hoyTexto
      });
    }

    // partimos el arreglo plano en semanas de 7
    this.semanas = [];
    for (let i = 0; i < celdas.length; i += 7) {
      this.semanas.push(celdas.slice(i, i + 7));
    }
  }

  // limitamos a maximo 3 puntitos para que no se amontonen visualmente
  puntos(cantidad: number): number[] {
    return Array(Math.min(cantidad, 3)).fill(0);
  }
}