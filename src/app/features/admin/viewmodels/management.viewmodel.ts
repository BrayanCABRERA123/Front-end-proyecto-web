import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { PermissionView, RoleCode, RolePermissionsApiService, RolePermissionsMatrix, permissionLabelKey } from '../../../core/services/role-permissions-api';
// catálogo real (booking-service) y tipos de vehículo (customer-service)
import { BookingApiService } from '../../../core/services/booking-api';
import { VehiclesService } from '../../../core/services/vehicles';
import { CatalogServiceResponse, ServiceCategoryResponse } from '../../../core/models/booking.models';
import { VehicleTypeResponse } from '../../../core/models/vehicle.models';
import { apiErrorKey } from '../../../core/utils/api-error';
// cuentas reales del security-service
import { UserAdminService } from '../../../core/services/user-admin';
import { AuthService } from '../../../core/services/auth';
import { AuthUser } from '../../../core/models/auth.models';
// promociones reales del payment-service
import { PromotionView, PromotionsApiService, SavePromotionRequest } from '../../../core/services/promotions-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { ServiceModalResult } from '../../../shared/dialogs/service-modal/service-modal';
import { CreateUserResult } from '../../../shared/dialogs/create-user-modal/create-user-modal';
import { AdminUser, Promotion, UserRole } from '../models/admin.models';
import { PromotionModalResult } from '../pages/management/components/promotion-modal/promotion-modal';

export type ManagementTab = 'users' | 'roles' | 'services' | 'promotions';

/** Gestión del admin: usuarios, permisos de los roles, catálogo de servicios y promociones. */
@Injectable()
export class ManagementViewModel {

  private readonly userAdmin = inject(UserAdminService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly vehiclesApi = inject(VehiclesService);
  private readonly promotionsApi = inject(PromotionsApiService);
  private readonly rolesApi = inject(RolePermissionsApiService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);

  readonly activeTab = signal<ManagementTab>('users');

  // --- usuarios (security-service) ---
  readonly users = signal<AdminUser[]>([]);
  readonly usersLoading = signal(true);
  readonly usersErrorKey = signal<string | null>(null);
  readonly userFilter = signal<'enabled' | 'disabled'>('enabled');
  readonly usersSearch = signal('');

  readonly filteredUsers = computed(() => {
    const term = this.usersSearch().trim().toLowerCase();
    const filter = this.userFilter();
    return this.users()
      .filter(u => filter === 'disabled' ? u.status === 'disabled' : u.status === 'active')
      .filter(u => !term
        || u.name.toLowerCase().includes(term)
        || u.email.toLowerCase().includes(term)
        // el tipo se busca por su nombre en el idioma de la pantalla ("Operario"), no por la clave
        || String(this.translate.instant(u.userType)).toLowerCase().includes(term));
  });

  readonly enabledCount = computed(() => this.users().filter(u => u.status === 'active').length);
  readonly disabledCount = computed(() => this.users().filter(u => u.status === 'disabled').length);

  // --- roles: los 3 son fijos, solo se editan sus permisos (ADR-015). La tabla se arma en un
  // computed para que el número de usuarios se actualice cuando lleguen las cuentas ---
  readonly roleMatrix = signal<RolePermissionsMatrix>({ permissions: [], roles: [] });
  readonly roles = computed(() => {
    const matrix = this.roleMatrix();
    return matrix.roles.map(r => toUserRole(r, matrix.permissions, this.users()));
  });

  // --- servicios: catálogo real con las tarifas vigentes de cada tipo de vehículo ---
  readonly services = signal<CatalogServiceResponse[]>([]);
  readonly categories = signal<ServiceCategoryResponse[]>([]);
  readonly vehicleTypes = signal<VehicleTypeResponse[]>([]);
  readonly servicesLoading = signal(true);
  readonly servicesErrorKey = signal<string | null>(null);

  // --- promociones (payment-service) ---
  readonly promotions = signal<Promotion[]>([]);
  private readonly promotionMetrics = signal({ redemptions: 0, savings: 0 });
  readonly totalRedemptions = computed(() => this.promotionMetrics().redemptions);
  readonly clientSavings = computed(() => this.promotionMetrics().savings);

  load(): void {
    this.loadUsers();
    this.loadServices();
    this.loadPromotions();
    this.loadRoles();
  }

  setTab(tab: ManagementTab): void {
    this.activeTab.set(tab);
  }

  // --- usuarios ---

  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersErrorKey.set(null);
    this.userAdmin.listAccounts().subscribe({
      next: page => {
        this.users.set(page.items.map(toAdminUser));
        this.usersLoading.set(false);
      },
      error: (error: unknown) => {
        this.usersErrorKey.set(apiErrorKey(error));
        this.usersLoading.set(false);
      }
    });
  }

  // el modal ya creó la cuenta: se recarga la lista y se avisa
  userCreated(created: CreateUserResult): void {
    this.loadUsers();
    this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.USER_CREATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.USER_CREATED_MESSAGE',
      { messageParams: { name: `${created.firstName} ${created.lastName}` } });
  }

  /** por qué no se puede desactivar esta cuenta (null = sí se puede). El backend aplica lo mismo */
  disableBlockedKey(user: AdminUser): string | null {
    if (user.status !== 'active') return null;
    if (this.isOwnAccount(user)) return 'API_ERRORS.CANNOT_DISABLE_OWN_ACCOUNT';
    if (user.role === 'ADMIN') return 'API_ERRORS.ADMIN_CANNOT_BE_DISABLED';
    return null;
  }

  /** nadie puede desactivar su propia cuenta (el backend también lo rechaza) */
  isOwnAccount(user: AdminUser): boolean {
    return user.id === String(this.auth.user()?.id);
  }

  // el backend desactiva la cuenta y cierra sus sesiones: ya no puede iniciar sesión
  setUserActive(user: AdminUser, active: boolean): void {
    this.userAdmin.setActive(Number(user.id), active).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => (u.id === user.id ? toAdminUser(updated) : u)));
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.USER_STATUS_TITLE',
          active ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLED_MESSAGE',
          { messageParams: { name: user.name } });
      },
      error: (error: unknown) => this.feedback.error('ADMIN_MANAGEMENT.FEEDBACK.USER_STATUS_ERROR_TITLE', apiErrorKey(error))
    });
  }

  // --- roles ---

  loadRoles(): void {
    this.rolesApi.matrix().subscribe({
      next: matrix => this.roleMatrix.set(matrix),
      // la pantalla se queda con lo que ya tenía
      error: () => undefined
    });
  }

  updateRolePermissions(role: RoleCode, permissionIds: number[]): void {
    this.rolesApi.update(role, permissionIds).subscribe({
      next: () => {
        this.loadRoles();
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_MESSAGE',
          { messageParams: { name: this.translate.instant(`PROFILE.ROLE.${role}`) } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // --- servicios ---

  loadServices(): void {
    this.servicesLoading.set(true);
    this.servicesErrorKey.set(null);
    forkJoin({
      services: this.bookingApi.adminServices(),
      categories: this.bookingApi.categories(),
      vehicleTypes: this.vehiclesApi.listVehicleTypes(),
    }).subscribe({
      next: ({ services, categories, vehicleTypes }) => {
        this.services.set(services);
        this.categories.set(categories);
        this.vehicleTypes.set(vehicleTypes);
        this.servicesLoading.set(false);
      },
      error: (error: unknown) => {
        this.servicesErrorKey.set(apiErrorKey(error));
        this.servicesLoading.set(false);
      }
    });
  }

  createService(result: ServiceModalResult): void {
    this.bookingApi.createService(result).subscribe({
      next: created => {
        this.services.update(list => [...list, created]);
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_MESSAGE',
          { messageParams: { name: created.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  updateService(service: CatalogServiceResponse, result: ServiceModalResult): void {
    this.bookingApi.updateService(service.id, result).subscribe({
      next: updated => {
        this.replaceService(updated);
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_MESSAGE',
          { messageParams: { name: updated.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  setServiceActive(service: CatalogServiceResponse, active: boolean): void {
    this.bookingApi.setServiceActive(service.id, active).subscribe({
      next: updated => {
        this.replaceService(updated);
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.SERVICE_STATUS_TITLE',
          active ? 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_ENABLED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DISABLED_MESSAGE',
          { messageParams: { name: service.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // borrado lógico en el backend: las reservas que ya lo usan conservan su precio
  deleteService(service: CatalogServiceResponse): void {
    this.bookingApi.deleteService(service.id).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s.id !== service.id));
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DELETED_MESSAGE',
          { messageParams: { name: service.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  private replaceService(updated: CatalogServiceResponse): void {
    this.services.update(list => list.map(s => (s.id === updated.id ? updated : s)));
  }

  // --- promociones ---

  loadPromotions(): void {
    this.promotionsApi.list().subscribe({
      next: list => this.promotions.set(list.map(toPromotion)),
      // la pantalla se queda con lo que ya tenía
      error: () => undefined
    });
    this.promotionsApi.metrics().subscribe({
      next: metrics => this.promotionMetrics.set(metrics),
      error: () => undefined
    });
  }

  createPromotion(result: PromotionModalResult): void {
    this.promotionsApi.create(toSaveRequest(result)).subscribe({
      next: created => {
        this.loadPromotions();
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_MESSAGE',
          { messageParams: { name: created.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  updatePromotion(promotion: Promotion, result: PromotionModalResult): void {
    this.promotionsApi.update(Number(promotion.id), toSaveRequest(result)).subscribe({
      next: () => {
        this.loadPromotions();
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_MESSAGE',
          { messageParams: { name: result.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // "Comenzar ahora" / "Pausar": alterna el estado operativo de la promoción
  setPromotionActive(promotion: Promotion, active: boolean): void {
    this.promotionsApi.setActive(Number(promotion.id), active).subscribe({
      next: () => {
        this.loadPromotions();
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.PROMO_STATUS_TITLE',
          active ? 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STARTED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STOPPED_MESSAGE',
          { messageParams: { name: promotion.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  deletePromotion(promotion: Promotion): void {
    this.promotionsApi.remove(Number(promotion.id)).subscribe({
      next: () => {
        this.loadPromotions();
        this.feedback.success('ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE', 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_DELETED_MESSAGE',
          { messageParams: { name: promotion.name } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }
}

// convierte la cuenta del backend al formato que usa la tabla
function toAdminUser(user: AuthUser): AdminUser {
  const role = user.roles.includes('ADMIN') ? 'ADMIN' : user.roles.includes('OPERATOR') ? 'OPERATOR' : 'CLIENT';
  return {
    id: String(user.id),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role,
    // llave de traducción del rol: la tabla la traduce
    userType: `PROFILE.ROLE.${role}`,
    dateAdded: user.createdAt ? user.createdAt.slice(0, 10) : '—',
    lastLogin: user.lastLogin ? user.lastLogin.slice(0, 10) : null,
    status: user.active ? 'active' : 'disabled'
  };
}

// permisos de un rol fijo -> lo que pinta la tabla. Los permisos van como llave de traducción por
// su code (el name de la base está solo en español); usersCount sale de las cuentas ya cargadas
function toUserRole(r: { role: RoleCode; permissionIds: number[] }, catalog: PermissionView[], accounts: AdminUser[]): UserRole {
  const byId = new Map(catalog.map(p => [p.id, p]));
  return {
    id: r.role,
    name: `PROFILE.ROLE.${r.role}`,
    description: '',
    permissions: r.permissionIds.map(id => {
      const permission = byId.get(id);
      return permission ? permissionLabelKey(permission.code) : String(id);
    }),
    usersCount: accounts.filter(a => a.userType === `PROFILE.ROLE.${r.role}`).length,
  };
}

// promoción del payment-service -> la que pinta la tabla. "paused" del backend se muestra como
// "inactive" (mismo significado, nombre distinto en este modelo)
function toPromotion(p: PromotionView): Promotion {
  return {
    id: String(p.id),
    name: p.name,
    description: p.description ?? '',
    couponCode: p.code,
    redemptions: p.redemptions,
    featured: p.featured,
    icon: p.icon ?? 'local_offer',
    features: p.benefits,
    status: p.status === 'paused' ? 'inactive' : p.status,
    startDate: p.validFrom,
    discountPercent: p.discountPercent,
    requiredPoints: p.requiredPoints,
  };
}

// la pantalla no pide fecha de fin (solo activa/pausa): se guarda "sin vencimiento". Tampoco pide
// precio ni duración: el cupón es un descuento sobre la reserva (payment-service los deja vacíos)
function toSaveRequest(result: PromotionModalResult): SavePromotionRequest {
  return {
    code: result.couponCode,
    name: result.name,
    description: result.description.trim() || null,
    icon: result.icon,
    featured: result.featured,
    benefits: result.features,
    validFrom: result.startDate,
    validTo: '9999-12-31',
    discountPercent: result.discountPercent,
    requiredPoints: result.requiredPoints,
  };
}
