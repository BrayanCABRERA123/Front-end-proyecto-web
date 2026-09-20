import { Injectable } from '@angular/core';

export type OperatorStatus = 'available' | 'in_service' | 'medical_leave';

export interface TodayService {
  code: string;
  vehicle: string;
  service: string;
  bay: string;
  time: string;
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface Certification {
  name: string;
  level: string;
}

export type CalendarBlockType = 'available' | 'service' | 'leave' | 'lunch';

export interface CalendarBlock {
  day: number; // 0 = lunes ... 5 = sábado
  startTime: string;
  endTime: string;
  type: CalendarBlockType;
  label: string;
  bay?: string;
}

export interface Operator {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  status: OperatorStatus;
  bay: string | null;
  weeklyServices: number;
  weeklyServicesChange: number;
  tags: string[];
  featured?: boolean;
  phone: string;
  email: string;
  availableHours: number;
  totalHours: number;
  punctuality: number;
  weeklyRevenue: number;
  weeklyGoalPercent: number;
  certifications: Certification[];
  todayServices: TodayService[];
  calendarBlocks: CalendarBlock[];
}

// roster fijo de operarios (mismos que ya usamos en el dashboard y en reservas)
// mientras no haya backend, este servicio hace de fuente única para toda la sección
@Injectable({ providedIn: 'root' })
export class OperatorsStore {

  readonly operators: Operator[] = [
    {
      id: 'OP-8492',
      name: 'Carlos Ruiz',
      initials: 'CR',
      specialty: 'Técnico Detailing Especializado & Corrección de Barniz',
      rating: 4.9,
      reviewsCount: 84,
      status: 'available',
      bay: 'Bahía 1 (Doble)',
      weeklyServices: 18,
      weeklyServicesChange: 12,
      tags: ['Pulido cerámico', 'Corrección barniz'],
      phone: '+57 314 789 2045',
      email: 'c.ruiz@lavadovehicular.co',
      availableHours: 38,
      totalHours: 44,
      punctuality: 98.5,
      weeklyRevenue: 1420000,
      weeklyGoalPercent: 104,
      certifications: [
        { name: 'Detailing Cerámico 9H', level: 'Certificado' },
        { name: 'Limpieza tapicería a vapor', level: 'Nivel Experto' },
        { name: 'Corrección de pintura en 3 pasos', level: 'Avanzado' },
      ],
      todayServices: [
        { code: '#8910', vehicle: 'Mazda CX-30', service: 'Lavado Premium Especializado', bay: 'Bahía 1', time: '08:00 - 10:30', status: 'completed' },
        { code: '#8935', vehicle: 'BMW X3 (Especial)', service: 'Detailing Cerámico + Corrección', bay: 'Bahía 1 (Doble)', time: '11:30 - 14:00', status: 'in_progress' },
        { code: '#8962', vehicle: 'Mazda CX-30 · Sofía Castro', service: 'Desinfección Total & Ozono', bay: 'Bahía 1', time: '14:30 - 16:30', status: 'scheduled' },
      ],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '10:30', type: 'service', label: '#8910 · Mazda CX-30 · Lavado Premium', bay: 'Bahía 1' },
        { day: 0, startTime: '10:30', endTime: '13:00', type: 'available', label: 'Disponible' },
        { day: 0, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
        { day: 0, startTime: '14:00', endTime: '16:30', type: 'available', label: 'Disponible' },
        { day: 1, startTime: '08:00', endTime: '11:30', type: 'service', label: '#8935 · BMW X3 · Detailing Cerámico', bay: 'Bahía 1 (Doble)' },
        { day: 1, startTime: '11:30', endTime: '13:00', type: 'available', label: 'Disponible' },
        { day: 1, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
        { day: 1, startTime: '14:00', endTime: '17:00', type: 'service', label: '#8948 · Kia Sportage · Encerado Orbital', bay: 'Bahía 2' },
        { day: 2, startTime: '08:00', endTime: '13:00', type: 'leave', label: 'Permiso médico · Control oftalmológico' },
        { day: 2, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
        { day: 2, startTime: '14:00', endTime: '18:00', type: 'available', label: 'Reincorpora tras cita médica' },
        { day: 3, startTime: '08:00', endTime: '11:00', type: 'service', label: '#8955 · Renault Duster · Lavado Express', bay: 'Bahía 1' },
        { day: 3, startTime: '11:00', endTime: '13:00', type: 'available', label: 'Disponible' },
        { day: 3, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
        { day: 3, startTime: '14:00', endTime: '16:30', type: 'service', label: '#8921 · Sofía Castro · Mazda CX-30', bay: 'Bahía 1 (Doble)' },
        { day: 3, startTime: '16:30', endTime: '18:00', type: 'available', label: 'Disponible' },
        { day: 4, startTime: '08:00', endTime: '12:00', type: 'available', label: 'Mañana libre' },
        { day: 4, startTime: '12:00', endTime: '13:00', type: 'service', label: '#8960 · Chevrolet Spark', bay: 'Bahía 1' },
        { day: 4, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
        { day: 4, startTime: '14:00', endTime: '17:30', type: 'service', label: '#8962 · Ford Explorer · Detailing Interior', bay: 'Bahía 1' },
        { day: 5, startTime: '08:00', endTime: '11:00', type: 'service', label: '#8970 · Mercedes G', bay: 'Bahía 2' },
        { day: 5, startTime: '11:00', endTime: '14:00', type: 'available', label: 'Disponible fin de semana' },
      ],
    },
    {
      id: 'OP-7310',
      name: 'Juan Díaz',
      initials: 'JD',
      specialty: 'Lavador Especialista',
      rating: 4.8,
      reviewsCount: 54,
      status: 'in_service',
      bay: 'Bahía 2',
      weeklyServices: 14,
      weeklyServicesChange: 6,
      tags: ['Lavado en espuma', 'Secado hidro'],
      phone: '+57 300 445 8821',
      email: 'j.diaz@lavadovehicular.co',
      availableHours: 40,
      totalHours: 44,
      punctuality: 95.2,
      weeklyRevenue: 980000,
      weeklyGoalPercent: 88,
      certifications: [{ name: 'Lavado en espuma activa', level: 'Certificado' }],
      todayServices: [
        { code: '#8901', vehicle: 'Audi A4 Sedán', service: 'Premium Automóvil', bay: 'Bahía 2', time: '15:00 - 16:00', status: 'in_progress' },
      ],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '18:00', type: 'service', label: 'Turno completo · Bahía 2', bay: 'Bahía 2' },
      ],
    },
    {
      id: 'OP-6120',
      name: 'Andrés Mora',
      initials: 'AM',
      specialty: 'Lavado General & Encerado',
      rating: 4.7,
      reviewsCount: 42,
      status: 'available',
      bay: 'Bahía 3',
      weeklyServices: 16,
      weeklyServicesChange: 4,
      tags: ['Cera Carnauba', 'Limpieza vidrios'],
      phone: '+57 317 220 6690',
      email: 'a.mora@lavadovehicular.co',
      availableHours: 42,
      totalHours: 44,
      punctuality: 97.1,
      weeklyRevenue: 860000,
      weeklyGoalPercent: 91,
      certifications: [{ name: 'Encerado con cera Carnauba', level: 'Nivel Experto' }],
      todayServices: [],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '18:00', type: 'available', label: 'Disponible' },
      ],
    },
    {
      id: 'OP-5088',
      name: 'Mateo Gómez',
      initials: 'MG',
      specialty: 'Tapicería e Interiores',
      rating: 4.6,
      reviewsCount: 38,
      status: 'medical_leave',
      bay: null,
      weeklyServices: 0,
      weeklyServicesChange: -100,
      tags: ['Limpieza a vapor', 'Hidratación cuero'],
      phone: '+57 313 556 8890',
      email: 'm.gomez@lavadovehicular.co',
      availableHours: 0,
      totalHours: 44,
      punctuality: 92.4,
      weeklyRevenue: 0,
      weeklyGoalPercent: 0,
      certifications: [{ name: 'Hidratación de cuero', level: 'Certificado' }],
      todayServices: [],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '18:00', type: 'leave', label: 'Incapacidad médica' },
      ],
    },
    {
      id: 'OP-4477',
      name: 'Camilo Restrepo',
      initials: 'CR',
      specialty: 'Lavado Motor & Chasis',
      rating: 4.8,
      reviewsCount: 62,
      status: 'in_service',
      bay: 'Bahía 1 (Doble)',
      weeklyServices: 15,
      weeklyServicesChange: 9,
      tags: ['Desengrase dieléctrico', 'Grafitado ecológico'],
      phone: '+57 316 774 0091',
      email: 'c.restrepo@lavadovehicular.co',
      availableHours: 36,
      totalHours: 44,
      punctuality: 94.0,
      weeklyRevenue: 1010000,
      weeklyGoalPercent: 95,
      certifications: [{ name: 'Desengrase de motor', level: 'Certificado' }],
      todayServices: [],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '18:00', type: 'service', label: 'Turno completo · Bahía 1 (Doble)', bay: 'Bahía 1 (Doble)' },
      ],
    },
    {
      id: 'OP-3305',
      name: 'Sofía Valencia',
      initials: 'SV',
      specialty: 'Tratamiento Cerámico y PPF',
      rating: 5.0,
      reviewsCount: 110,
      status: 'available',
      bay: 'Bahía 2',
      weeklyServices: 21,
      weeklyServicesChange: 18,
      tags: ['Coating 9H', 'PPF Frontal'],
      featured: true,
      phone: '+57 302 667 4410',
      email: 's.valencia@lavadovehicular.co',
      availableHours: 41,
      totalHours: 44,
      punctuality: 99.1,
      weeklyRevenue: 1680000,
      weeklyGoalPercent: 121,
      certifications: [
        { name: 'Coating cerámico 9H', level: 'Certificado' },
        { name: 'Instalación de PPF', level: 'Nivel Experto' },
      ],
      todayServices: [],
      calendarBlocks: [
        { day: 0, startTime: '08:00', endTime: '18:00', type: 'available', label: 'Disponible' },
      ],
    },
  ];

  getById(id: string): Operator | undefined {
    return this.operators.find(o => o.id === id);
  }
}
