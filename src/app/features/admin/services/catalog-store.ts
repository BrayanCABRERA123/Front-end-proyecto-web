import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import { AdminUser, CatalogService, Promotion, UserRole } from '../models/admin.models';

const STORAGE_KEY = 'adminCatalog';

interface CatalogState {
  users: AdminUser[];
  roles: UserRole[];
  services: CatalogService[];
  promotions: Promotion[];
}

const DEFAULT_STATE: CatalogState = {
  users: [
    { id: 'u1', name: 'Uziel Loranca Cantoral', email: 'nathan.roberts@example.com', userType: 'Administrador', dateAdded: '2023-02-07', invited: false, status: 'active' },
    { id: 'u2', name: 'Iver Avedillo Herbias', email: 'deanna.curtis@example.com', userType: 'Administrador', dateAdded: '2023-08-15', invited: true, status: 'active' },
    { id: 'u3', name: 'Aguilda Lloredo Ruifrancos', email: 'debbie.baker@example.com', userType: 'Administrador', dateAdded: '2023-03-03', invited: false, status: 'active' },
  ],
  roles: [
    { id: 'r1', name: 'Administrador', description: 'Acceso total a todos los paneles y operaciones del negocio.', permissions: ['view_panels', 'create_records', 'edit_data', 'delete'], usersCount: 3 },
    { id: 'r2', name: 'Supervisor de Bahía', description: 'Gestiona turnos, asignaciones y disponibilidad de operarios.', permissions: ['view_panels', 'create_records', 'edit_data'], usersCount: 0 },
    { id: 'r3', name: 'Soporte', description: 'Consulta reservas y pagos para atender solicitudes de clientes.', permissions: ['view_panels'], usersCount: 0 },
  ],
  services: [
    { id: 's1', name: 'Encerado', price: 150000, durationMin: 45, category: 'brillado', status: 'active' },
    { id: 's2', name: 'Lavado básico', price: 80000, durationMin: 30, category: 'lavado', status: 'active' },
    { id: 's3', name: 'Lavado completo', price: 250000, durationMin: 60, category: 'lavado', status: 'inactive' },
    { id: 's4', name: 'Pulido premium', price: 320000, durationMin: 90, category: 'brillado', status: 'active' },
  ],
  promotions: [
    {
      id: 'p1', name: 'Básico', description: 'Lavado exterior del vehículo', price: 20000, durationMin: 45,
      couponCode: 'BASICO20', redemptions: 412, featured: false, icon: 'directions_car',
      features: ['Lavado exterior completo', 'Aspirado básico', 'Limpieza de vidrios'],
      status: 'active', startDate: '2026-08-01',
    },
    {
      id: 'p2', name: 'Premium', description: 'Lavado completo con encerado', price: 35000, durationMin: 75,
      couponCode: 'PREMIUM35', redemptions: 890, featured: true, icon: 'water_drop',
      features: ['Todo lo del Básico', 'Lavado de motor', 'Cera líquida protectora'],
      status: 'active', startDate: '2026-05-15',
    },
    {
      id: 'p3', name: 'Completo', description: 'Lavado exterior e interior', price: 50000, durationMin: 120,
      couponCode: 'COMPLETO50', redemptions: 320, featured: false, icon: 'auto_awesome',
      features: ['Todo lo del Premium', 'Encerado a mano', 'Detallado de interiores'],
      status: 'scheduled', startDate: '2026-12-01',
    },
  ],
};

/**
 * Catálogo de la sección "Gestión": usuarios, roles, servicios y promociones.
 *
 * Todas las pestañas de la pantalla leen de aquí para que un cambio (activar un
 * usuario, editar un rol, pausar un servicio, activar una promoción) se refleje
 * al instante y sobreviva a una recarga del navegador. Al conectar el backend se
 * sustituyen los métodos por llamadas HTTP sin tocar las pantallas.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {

  private readonly state = signal<CatalogState>(this.load());

  readonly users = computed(() => this.state().users);
  readonly roles = computed(() => this.state().roles);
  readonly services = computed(() => this.state().services);
  readonly promotions = computed(() => this.state().promotions);

  readonly activePromotionsCount = computed(() =>
    this.state().promotions.filter(p => p.status === 'active').length
  );

  readonly totalRedemptions = computed(() =>
    this.state().promotions.reduce((sum, p) => sum + p.redemptions, 0)
  );

  /* ---------- usuarios ---------- */

  addUser(value: { name: string; email: string; role: string; invite: boolean }): AdminUser {
    const id = this.nextId(this.state().users, 'u');
    const user: AdminUser = {
      id,
      name: value.name,
      email: value.email,
      userType: value.role,
      dateAdded: new Date().toISOString().slice(0, 10),
      invited: value.invite,
      status: 'active',
    };
    this.update({ users: [...this.state().users, user] });
    return user;
  }

  updateUser(id: string, changes: Partial<Omit<AdminUser, 'id'>>): void {
    this.update({ users: this.state().users.map(u => (u.id === id ? { ...u, ...changes, id } : u)) });
  }

  toggleUserStatus(id: string): void {
    this.update({
      users: this.state().users.map(u => (u.id === id ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' } : u)),
    });
  }

  removeUser(id: string): void {
    this.update({ users: this.state().users.filter(u => u.id !== id) });
  }

  /* ---------- roles ---------- */

  addRole(value: { name: string; description: string; permissions: string[] }): UserRole {
    const role: UserRole = {
      id: this.nextId(this.state().roles, 'r'),
      name: value.name,
      description: value.description,
      permissions: value.permissions,
      usersCount: 0,
    };
    this.update({ roles: [...this.state().roles, role] });
    return role;
  }

  updateRole(id: string, changes: Partial<Omit<UserRole, 'id'>>): void {
    this.update({ roles: this.state().roles.map(r => (r.id === id ? { ...r, ...changes, id } : r)) });
  }

  removeRole(id: string): void {
    this.update({ roles: this.state().roles.filter(r => r.id !== id) });
  }

  /* ---------- servicios ---------- */

  addService(value: { name: string; price: number; durationMin: number; category: string }): CatalogService {
    const service: CatalogService = {
      id: this.nextId(this.state().services, 's'),
      ...value,
      status: 'active',
    };
    this.update({ services: [...this.state().services, service] });
    return service;
  }

  updateService(id: string, changes: Partial<Omit<CatalogService, 'id'>>): void {
    this.update({ services: this.state().services.map(s => (s.id === id ? { ...s, ...changes, id } : s)) });
  }

  toggleServiceStatus(id: string): void {
    this.update({
      services: this.state().services.map(s =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      ),
    });
  }

  removeService(id: string): void {
    this.update({ services: this.state().services.filter(s => s.id !== id) });
  }

  /* ---------- promociones ---------- */

  addPromotion(value: Omit<Promotion, 'id'>): Promotion {
    const promotion: Promotion = { ...value, id: this.nextId(this.state().promotions, 'p') };
    this.update({ promotions: [...this.state().promotions, promotion] });
    return promotion;
  }

  updatePromotion(id: string, changes: Partial<Omit<Promotion, 'id'>>): void {
    this.update({ promotions: this.state().promotions.map(p => (p.id === id ? { ...p, ...changes, id } : p)) });
  }

  /** la promoción empieza a correr desde hoy (acciones "Comenzar ahora" / "Pausar") */
  setPromotionActive(id: string, active: boolean): void {
    this.update({
      promotions: this.state().promotions.map(p =>
        p.id === id
          ? { ...p, status: active ? 'active' : 'inactive', startDate: active ? new Date().toISOString().slice(0, 10) : p.startDate }
          : p
      ),
    });
  }

  removePromotion(id: string): void {
    this.update({ promotions: this.state().promotions.filter(p => p.id !== id) });
  }

  /* ---------- internos ---------- */

  private nextId(list: { id: string }[], prefix: string): string {
    const numbers = list.map(item => Number(item.id.replace(/\D/g, ''))).filter(n => !Number.isNaN(n));
    return prefix + (numbers.length ? Math.max(...numbers) + 1 : 1);
  }

  private update(changes: Partial<CatalogState>): void {
    const next = { ...this.state(), ...changes };
    this.state.set(next);
    writeStorage(STORAGE_KEY, next);
  }

  private load(): CatalogState {
    return readStorage<CatalogState>(STORAGE_KEY, DEFAULT_STATE);
  }
}