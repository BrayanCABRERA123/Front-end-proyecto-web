import { Component } from '@angular/core';

interface DiaIngreso { dia: string; valor: number; etiqueta: string; hoy?: boolean; }
interface Operario { iniciales: string; nombre: string; rol: string; estado: 'ocupado' | 'disponible' | 'incapacidad'; texto: string; }
interface PagoPendiente { cliente: string; banco: string; bancoClase: string; servicio: string; ref: string; monto: number; }
interface ReservaSinOperario { hora: string; bahia: string; cliente: string; vehiculo: string; servicio: string; proxima?: boolean; icono: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent {
  nombre = 'Laura';
  fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  stats = {
    reservasHoy: 18, variacion: 3, serviciosEnProgreso: 4, bahiasActivas: 4,
    pagosPorVerificar: 5, ingresosDia: 680000,
  };

  ingresos: DiaIngreso[] = [
    { dia: 'Lun', valor: 520000, etiqueta: '$520k' },
    { dia: 'Mar', valor: 610000, etiqueta: '$610k' },
    { dia: 'Mié', valor: 450000, etiqueta: '$450k' },
    { dia: 'Jue (Hoy)', valor: 680000, etiqueta: '$680k', hoy: true },
    { dia: 'Vie', valor: 790000, etiqueta: '$790k' },
    { dia: 'Sáb', valor: 1100000, etiqueta: '$1.1M' },
    { dia: 'Dom', valor: 670000, etiqueta: '$670k' },
  ];

  operarios: Operario[] = [
    { iniciales: 'JD', nombre: 'Juan Díaz', rol: 'Lavador Especialista', estado: 'ocupado', texto: 'Bahía 2' },
    { iniciales: 'CR', nombre: 'Carlos Ruiz', rol: 'Técnico Detailing', estado: 'disponible', texto: 'Disponible' },
    { iniciales: 'MG', nombre: 'Mateo Gómez', rol: 'Tapicería e Interiores', estado: 'incapacidad', texto: 'Incapacidad' },
  ];

  pagos: PagoPendiente[] = [
    { cliente: 'Andrés Morales', banco: 'Bancolombia', bancoClase: 'bancolombia', servicio: 'Lavado Detallado + Encerado', ref: '#BC-98402', monto: 85000 },
    { cliente: 'Carolina Vega', banco: 'Nequi', bancoClase: 'nequi', servicio: 'Combo Completo SUV', ref: '#NQ-44129', monto: 120000 },
    { cliente: 'Felipe Montoya', banco: 'Daviplata', bancoClase: 'daviplata', servicio: 'Lavado Básico Sedán', ref: '#DV-11208', monto: 45000 },
  ];

  reservasSinOperario: ReservaSinOperario[] = [
    { hora: '15:00', bahia: 'Bahía 3', cliente: 'Sofía Castro', vehiculo: 'Mazda CX-30', servicio: 'Premium Especial', proxima: true, icono: 'workspace_premium' },
    { hora: '15:30', bahia: 'Bahía 1', cliente: 'Diego Herrera', vehiculo: 'Toyota Hilux', servicio: 'Desinfección + Tapicería', icono: 'sanitizer' },
    { hora: '16:15', bahia: 'Bahía 2', cliente: 'Mariana Gómez', vehiculo: 'Renault Duster', servicio: 'Lavado General + Polichado', icono: 'auto_awesome' },
  ];

  get totalSemana(): number {
    return this.ingresos.reduce((suma, d) => suma + d.valor, 0);
  }

  get maxIngreso(): number {
    return Math.max(...this.ingresos.map(d => d.valor));
  }

  altura(valor: number): number {
    return Math.round((valor / this.maxIngreso) * 100);
  }

  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }

  contar(estado: Operario['estado']): number {
    return this.operarios.filter(o => o.estado === estado).length;
  }
}
