import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { CreateUserModal, CreateUserResult } from '../../../../shared/dialogs/create-user-modal/create-user-modal';
import { CreateRoleModal, CreateRoleData, CreateRoleResult } from '../../../../shared/dialogs/create-role-modal/create-role-modal';
import {
  PermissionView,
  RoleCode,
  RolePermissionsApiService,
  RolePermissionsMatrix,
  permissionLabelKey,
} from '../../../../core/services/role-permissions-api';
import { ServiceModal, ServiceModalData, ServiceModalResult } from '../../../../shared/dialogs/service-modal/service-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { AdminUser, Promotion, UserRole } from '../../models/admin.models';
// catálogo real (booking-service) y tipos de vehículo (customer-service)
import { forkJoin } from 'rxjs';
import { BookingApiService } from '../../../../core/services/booking-api';
import { VehiclesService } from '../../../../core/services/vehicles';
import {
  CatalogServiceResponse,
  ServiceCategoryResponse,
  ServicePriceResponse,
} from '../../../../core/models/booking.models';
import { VehicleTypeResponse } from '../../../../core/models/vehicle.models';
import { apiErrorKey } from '../../../../core/utils/api-error';
import { PromotionModal, PromotionModalData, PromotionModalResult } from './components/promotion-modal/promotion-modal';
// cuentas reales del security-service
import { UserAdminService } from '../../../../core/services/user-admin';
import { AuthUser } from '../../../../core/models/auth.models';
// promociones reales del payment-service
import { PromotionView, PromotionsApiService } from '../../../../core/services/promotions-api';

type ManagementTab = 'users' | 'roles' | 'services' | 'promotions';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './management.html',
  styleUrl: './management.scss'
})
export class ManagementComponent implements OnInit {

  activeTab: ManagementTab = 'users';

  tabs: { key: ManagementTab; icon: string }[] = [
    { key: 'users', icon: 'group' },
    { key: 'roles', icon: 'verified_user' },
    { key: 'services', icon: 'build' },
    { key: 'promotions', icon: 'local_offer' },
  ];

  userFilter: 'enabled' | 'registered' | 'disabled' = 'enabled';
  usersSearch = '';

  // cuentas reales (security-service)
  private readonly accounts = signal<AdminUser[]>([]);
  usersLoading = signal(true);
  usersErrorKey = signal<string | null>(null);

  // promociones reales (payment-service)
  private readonly promotionsList = signal<Promotion[]>([]);
  private readonly promotionMetrics = signal({ redemptions: 0, savings: 0, conversion: 0 });

  // permisos de los 3 roles fijos, reales (security-service, ADR-015). La tabla se arma en
  // computed() para que el número de usuarios se actualice cuando lleguen las cuentas, sin
  // importar cuál de las dos peticiones responde primero
  private readonly roleMatrix = signal<RolePermissionsMatrix>({ permissions: [], roles: [] });
  private readonly rolesList = computed(() => {
    const matrix = this.roleMatrix();
    return matrix.roles.map(r => this.toUserRole(r, matrix.permissions, this.accounts()));
  });

  private readonly userAdmin = inject(UserAdminService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly vehiclesApi = inject(VehiclesService);
  private readonly promotionsApi = inject(PromotionsApiService);
  private readonly rolesApi = inject(RolePermissionsApiService);
  private readonly translate = inject(TranslateService);

  constructor(
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadServices();
    this.loadPromotions();
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesApi.matrix().subscribe({
      next: matrix => this.roleMatrix.set(matrix),
      error: () => { /* la pantalla se queda con lo que ya tenía */ },
    });
  }

  // permisos de un rol fijo (security-service) -> lo que pinta la tabla. Los permisos van como
  // llave de traducción por su code (el name de la base está solo en español). usersCount sale de
  // las cuentas ya cargadas (toAdminUser guarda el rol como llave PROFILE.ROLE.<code>)
  private toUserRole(r: { role: RoleCode; permissionIds: number[] }, catalog: PermissionView[],
                     accounts: AdminUser[]): UserRole {
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

  loadPromotions(): void {
    this.promotionsApi.list().subscribe({
      next: list => this.promotionsList.set(list.map(p => this.toPromotion(p))),
      error: () => { /* la pantalla se queda con lo que ya tenía */ },
    });
    this.promotionsApi.metrics().subscribe({
      next: metrics => this.promotionMetrics.set(metrics),
      error: () => undefined,
    });
  }

  // promoción del payment-service -> la que pinta la tabla. status "paused" del backend se
  // muestra como "inactive" (mismo significado, nombre distinto en este modelo)
  private toPromotion(p: PromotionView): Promotion {
    return {
      id: String(p.id),
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      durationMin: p.durationMinutes,
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

  // la pantalla no pide fecha de fin (solo activa/pausa): se guarda "sin vencimiento"
  private toSaveRequest(result: PromotionModalResult) {
    return {
      code: result.couponCode,
      name: result.name,
      description: result.description.trim() || null,
      price: result.price,
      durationMinutes: result.durationMin,
      icon: result.icon,
      featured: result.featured,
      benefits: result.features,
      validFrom: result.startDate,
      validTo: '9999-12-31',
      discountPercent: result.discountPercent,
      requiredPoints: result.requiredPoints,
    };
  }

  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersErrorKey.set(null);

    this.userAdmin.listAccounts().subscribe({
      next: page => {
        this.accounts.set(page.items.map(user => this.toAdminUser(user)));
        this.usersLoading.set(false);
      },
      error: (error: unknown) => {
        this.usersErrorKey.set(apiErrorKey(error));
        this.usersLoading.set(false);
      }
    });
  }

  // convierte la cuenta del backend al formato que usa la tabla
  private toAdminUser(user: AuthUser): AdminUser {
    const role = user.roles.includes('ADMIN') ? 'ADMIN' : user.roles.includes('OPERATOR') ? 'OPERATOR' : 'CLIENT';
    return {
      id: String(user.id),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      // llave de traducción del rol: la tabla la traduce
      userType: `PROFILE.ROLE.${role}`,
      // la base todavía no guarda la fecha de registro: se muestra el último ingreso
      dateAdded: user.lastLogin ? user.lastLogin.slice(0, 10) : '—',
      invited: false,
      status: user.active ? 'active' : 'disabled'
    };
  }

  setTab(tab: ManagementTab): void {
    this.activeTab = tab;
  }

  // --- datos desde el store ---

  get users(): AdminUser[] { return this.accounts(); }
  get roles(): UserRole[] { return this.rolesList(); }
  get services(): CatalogServiceResponse[] { return this.catalogServices(); }
  get promotions(): Promotion[] { return this.promotionsList(); }

  // --- USUARIOS ---

  get filteredUsers(): AdminUser[] {
    const term = this.usersSearch.trim().toLowerCase();

    return this.users
      .filter(u => (this.userFilter === 'disabled' ? u.status === 'disabled' : u.status === 'active'))
      .filter(u => this.userFilter !== 'registered' || u.invited)
      .filter(u => !term
        || u.name.toLowerCase().includes(term)
        || u.email.toLowerCase().includes(term)
        || u.userType.toLowerCase().includes(term));
  }

  get enabledCount(): number { return this.users.filter(u => u.status === 'active').length; }
  get registeredCount(): number { return this.users.filter(u => u.invited).length; }
  get disabledCount(): number { return this.users.filter(u => u.status === 'disabled').length; }

  openCreateUser(): void {
    const dialogRef = this.dialog.open(CreateUserModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((created: CreateUserResult | null) => {
      if (!created) return;
      this.loadUsers();
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.USER_CREATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.USER_CREATED_MESSAGE',
        { messageParams: { name: `${created.firstName} ${created.lastName}` } }
      );
    });
  }

  toggleUserStatus(user: AdminUser): void {
    const disabling = user.status === 'active';
    const data: ConfirmModalData = {
      title: disabling ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLE_TITLE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLE_TITLE',
      message: disabling ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLE_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLE_MESSAGE',
      messageParams: { name: user.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: disabling,
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      // el backend desactiva la cuenta y cierra sus sesiones: ya no puede iniciar sesión
      this.userAdmin.setActive(Number(user.id), !disabling).subscribe({
        next: updated => {
          this.accounts.update(list => list.map(u => (u.id === user.id ? this.toAdminUser(updated) : u)));
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.USER_STATUS_TITLE',
            disabling ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLED_MESSAGE',
            { messageParams: { name: user.name } }
          );
        },
        error: (error: unknown) => {
          this.feedback.error('ADMIN_MANAGEMENT.FEEDBACK.USER_STATUS_ERROR_TITLE', apiErrorKey(error));
        }
      });
    });
  }

  // --- ROLES (ADR-015: los 3 roles son fijos, solo se editan sus permisos) ---

  openEditRole(role: UserRole): void {
    const data: CreateRoleData = {
      roles: this.roleMatrix().roles,
      permissions: this.roleMatrix().permissions,
      initialRole: role.id as RoleCode,
    };

    const dialogRef = this.dialog.open(CreateRoleModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: CreateRoleResult | null) => {
      if (!result) return;
      this.rolesApi.update(result.role, result.permissionIds).subscribe({
        next: () => {
          this.loadRoles();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_MESSAGE',
            { messageParams: { name: this.translate.instant(`PROFILE.ROLE.${result.role}`) } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
    });
  }

  // --- SERVICIOS (booking-service) ---

  // catálogo real con las tarifas vigentes de cada tipo de vehículo
  private readonly catalogServices = signal<CatalogServiceResponse[]>([]);
  private categories: ServiceCategoryResponse[] = [];
  private vehicleTypes: VehicleTypeResponse[] = [];
  servicesLoading = signal(true);
  servicesErrorKey = signal<string | null>(null);

  loadServices(): void {
    this.servicesLoading.set(true);
    this.servicesErrorKey.set(null);
    forkJoin({
      services: this.bookingApi.adminServices(),
      categories: this.bookingApi.categories(),
      vehicleTypes: this.vehiclesApi.listVehicleTypes(),
    }).subscribe({
      next: ({ services, categories, vehicleTypes }) => {
        this.catalogServices.set(services);
        this.categories = categories;
        this.vehicleTypes = vehicleTypes;
        this.servicesLoading.set(false);
      },
      error: (error) => {
        this.servicesErrorKey.set(apiErrorKey(error));
        this.servicesLoading.set(false);
      }
    });
  }

  // tarifa que se muestra en la tabla: la del automóvil (tipo 1) o, si no tiene, la primera
  referencePrice(service: CatalogServiceResponse): ServicePriceResponse | null {
    return service.prices.find(p => p.vehicleTypeId === 1) ?? service.prices[0] ?? null;
  }

  openCreateService(): void {
    const data: ServiceModalData = { categories: this.categories, vehicleTypes: this.vehicleTypes };
    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: ServiceModalResult | null) => {
      if (!result) return;
      this.bookingApi.createService(result).subscribe({
        next: (created) => {
          this.catalogServices.update(list => [...list, created]);
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_MESSAGE',
            { messageParams: { name: created.name } }
          );
        },
        error: (error) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });
  }

  openEditService(service: CatalogServiceResponse): void {
    const data: ServiceModalData = { service, categories: this.categories, vehicleTypes: this.vehicleTypes };
    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: ServiceModalResult | null) => {
      if (!result) return;
      this.bookingApi.updateService(service.id, result).subscribe({
        next: (updated) => {
          this.replaceService(updated);
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_MESSAGE',
            { messageParams: { name: updated.name } }
          );
        },
        error: (error) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });
  }

  toggleServiceStatus(service: CatalogServiceResponse): void {
    const activating = !service.active;
    const data: ConfirmModalData = {
      title: activating ? 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_ENABLE_TITLE' : 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DISABLE_TITLE',
      message: activating ? 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_ENABLE_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DISABLE_MESSAGE',
      messageParams: { name: service.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: !activating,
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.bookingApi.setServiceActive(service.id, activating).subscribe({
        next: (updated) => {
          this.replaceService(updated);
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_STATUS_TITLE',
            activating ? 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_ENABLED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DISABLED_MESSAGE',
            { messageParams: { name: service.name } }
          );
        },
        error: (error) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });
  }

  // borrado lógico en el backend: las reservas que ya lo usan conservan su precio
  deleteService(service: CatalogServiceResponse): void {
    this.confirmDelete(() => {
      this.bookingApi.deleteService(service.id).subscribe({
        next: () => {
          this.catalogServices.update(list => list.filter(s => s.id !== service.id));
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DELETED_MESSAGE',
            { messageParams: { name: service.name } }
          );
        },
        error: (error) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });
  }

  private replaceService(updated: CatalogServiceResponse): void {
    this.catalogServices.update(list => list.map(s => (s.id === updated.id ? updated : s)));
  }

  // --- PROMOCIONES ---

  get totalRedemptions(): number { return this.promotionMetrics().redemptions; }

  get clientSavings(): number { return this.promotionMetrics().savings; }

  // no hay forma de contar cuántas veces se mostró/ofreció una promoción todavía, así que la
  // conversión real no se puede calcular (ver PromotionApplicationService en payment-service)
  get conversion(): number { return this.promotionMetrics().conversion; }

  openCreatePromotion(): void {
    const dialogRef = this.dialog.open(PromotionModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: PromotionModalResult | null) => {
      if (!result) return;
      this.promotionsApi.create(this.toSaveRequest(result)).subscribe({
        next: created => {
          this.loadPromotions();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_MESSAGE',
            { messageParams: { name: created.name } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
    });
  }

  openEditPromotion(promotion: Promotion): void {
    const data: PromotionModalData = { promotion };

    const dialogRef = this.dialog.open(PromotionModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PromotionModalResult | null) => {
      if (!result) return;
      this.promotionsApi.update(Number(promotion.id), this.toSaveRequest(result)).subscribe({
        next: () => {
          this.loadPromotions();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_MESSAGE',
            { messageParams: { name: result.name } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
    });
  }

  // "Comenzar ahora" / "Pausar": alterna el estado operativo de la promoción
  togglePromotion(promotion: Promotion): void {
    const stopping = promotion.status === 'active';

    if (!stopping) {
      this.promotionsApi.setActive(Number(promotion.id), true).subscribe({
        next: () => {
          this.loadPromotions();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STATUS_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STARTED_MESSAGE',
            { messageParams: { name: promotion.name } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
      return;
    }

    const data: ConfirmModalData = {
      title: 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STOP_TITLE',
      message: 'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STOP_MESSAGE',
      messageParams: { name: promotion.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: true,
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.promotionsApi.setActive(Number(promotion.id), false).subscribe({
        next: () => {
          this.loadPromotions();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STATUS_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STOPPED_MESSAGE',
            { messageParams: { name: promotion.name } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
    });
  }

  deletePromotion(promotion: Promotion): void {
    this.confirmDelete(() => {
      this.promotionsApi.remove(Number(promotion.id)).subscribe({
        next: () => {
          this.loadPromotions();
          this.feedback.success(
            'ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE',
            'ADMIN_MANAGEMENT.FEEDBACK.PROMO_DELETED_MESSAGE',
            { messageParams: { name: promotion.name } }
          );
        },
        error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
      });
    });
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // --- confirmación compartida para borrar cualquier registro de las tablas ---
  private confirmDelete(onConfirm: () => void): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.TITLE',
      message: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.MESSAGE',
      confirmText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CONFIRM',
      cancelText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CANCEL',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) onConfirm();
    });
  }
}