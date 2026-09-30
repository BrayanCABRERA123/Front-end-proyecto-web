import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { CreateUserModal, CreateUserResult } from '../../../../shared/dialogs/create-user-modal/create-user-modal';
import { CreateRoleModal, CreateRoleData, CreateRoleResult } from '../../../../shared/dialogs/create-role-modal/create-role-modal';
import { ServiceModal, ServiceModalData, ServiceModalResult } from '../../../../shared/dialogs/service-modal/service-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { CatalogStore } from '../../services/catalog-store';
import { AdminUser, CatalogService, Promotion, UserRole } from '../../models/admin.models';
import { PromotionModal, PromotionModalData, PromotionModalResult } from './components/promotion-modal/promotion-modal';
// cuentas reales del security-service
import { UserAdminService } from '../../../../core/services/user-admin';
import { AuthUser } from '../../../../core/models/auth.models';
import { apiErrorKey } from '../../../../core/utils/api-error';

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

  // conversión estimada de cupones (vendrá de analítica cuando exista el backend)
  private readonly PROMO_CONVERSION = 31.2;

  // cuentas reales (security-service); los demás tabs siguen con datos de prueba
  private readonly accounts = signal<AdminUser[]>([]);
  usersLoading = signal(true);
  usersErrorKey = signal<string | null>(null);

  private readonly userAdmin = inject(UserAdminService);

  constructor(
    private store: CatalogStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
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
  get roles(): UserRole[] { return this.store.roles(); }
  get services(): CatalogService[] { return this.store.services(); }
  get promotions(): Promotion[] { return this.store.promotions(); }

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

  // --- ROLES ---

  openCreateRole(): void {
    const dialogRef = this.dialog.open(CreateRoleModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: CreateRoleResult | null) => {
      if (!result) return;
      const created = this.store.addRole(result);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.ROLE_CREATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.ROLE_CREATED_MESSAGE',
        { messageParams: { name: created.name } }
      );
    });
  }

  openEditRole(role: UserRole): void {
    const data: CreateRoleData = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    };

    const dialogRef = this.dialog.open(CreateRoleModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: CreateRoleResult | null) => {
      if (!result) return;
      this.store.updateRole(role.id, {
        name: result.name,
        description: result.description,
        permissions: result.permissions,
      });
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.ROLE_UPDATED_MESSAGE',
        { messageParams: { name: result.name } }
      );
    });
  }

  deleteRole(role: UserRole): void {
    this.confirmDelete(() => {
      this.store.removeRole(role.id);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.ROLE_DELETED_MESSAGE',
        { messageParams: { name: role.name } }
      );
    });
  }

  // --- SERVICIOS ---

  openCreateService(): void {
    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: ServiceModalResult | null) => {
      if (!result) return;
      const created = this.store.addService(result);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_CREATED_MESSAGE',
        { messageParams: { name: created.name } }
      );
    });
  }

  openEditService(service: CatalogService): void {
    const data: ServiceModalData = {
      name: service.name,
      price: service.price,
      description: service.category,
      durationMin: service.durationMin,
      category: service.category
    };

    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: ServiceModalResult | null) => {
      if (!result) return;
      this.store.updateService(service.id, {
        name: result.name,
        price: result.price,
        durationMin: result.durationMin,
        category: result.category,
      });
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_UPDATED_MESSAGE',
        { messageParams: { name: result.name } }
      );
    });
  }

  toggleServiceStatus(service: CatalogService): void {
    const activating = service.status === 'inactive';
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
      this.store.toggleServiceStatus(service.id);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_STATUS_TITLE',
        activating ? 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_ENABLED_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DISABLED_MESSAGE',
        { messageParams: { name: service.name } }
      );
    });
  }

  deleteService(service: CatalogService): void {
    this.confirmDelete(() => {
      this.store.removeService(service.id);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.SERVICE_DELETED_MESSAGE',
        { messageParams: { name: service.name } }
      );
    });
  }

  // --- PROMOCIONES ---

  get totalRedemptions(): number { return this.store.totalRedemptions(); }

  // los cupones se modelan con un descuento promedio del 20% sobre su tarifa
  get clientSavings(): number {
    return this.promotions.reduce((sum, p) => sum + p.redemptions * p.price * 0.2, 0);
  }

  get conversion(): number {
    return this.PROMO_CONVERSION;
  }

  openCreatePromotion(): void {
    const dialogRef = this.dialog.open(PromotionModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: PromotionModalResult | null) => {
      if (!result) return;
      const created = this.store.addPromotion(result);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_CREATED_MESSAGE',
        { messageParams: { name: created.name } }
      );
    });
  }

  openEditPromotion(promotion: Promotion): void {
    const data: PromotionModalData = { promotion };

    const dialogRef = this.dialog.open(PromotionModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PromotionModalResult | null) => {
      if (!result) return;
      this.store.updatePromotion(promotion.id, result);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_UPDATED_MESSAGE',
        { messageParams: { name: result.name } }
      );
    });
  }

  // "Comenzar ahora" / "Pausar": alterna el estado operativo de la promoción
  togglePromotion(promotion: Promotion): void {
    const active = promotion.status === 'active' || promotion.status === 'scheduled';
    const stopping = promotion.status === 'active';

    if (!stopping) {
      this.store.setPromotionActive(promotion.id, true);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STATUS_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STARTED_MESSAGE',
        { messageParams: { name: promotion.name } }
      );
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
      this.store.setPromotionActive(promotion.id, false);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STATUS_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_STOPPED_MESSAGE',
        { messageParams: { name: promotion.name } }
      );
    });
  }

  deletePromotion(promotion: Promotion): void {
    this.confirmDelete(() => {
      this.store.removePromotion(promotion.id);
      this.feedback.success(
        'ADMIN_MANAGEMENT.FEEDBACK.DELETED_TITLE',
        'ADMIN_MANAGEMENT.FEEDBACK.PROMO_DELETED_MESSAGE',
        { messageParams: { name: promotion.name } }
      );
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