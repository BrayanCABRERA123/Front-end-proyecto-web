import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { CreateUserModal, CreateUserResult } from '../../../../shared/dialogs/create-user-modal/create-user-modal';
import { ServiceModal, ServiceModalData, ServiceModalResult } from '../../../../shared/dialogs/service-modal/service-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { AdminUser, Promotion } from '../../models/admin.models';
import { CatalogServiceResponse, ServicePriceResponse } from '../../../../core/models/booking.models';
import { PromotionModal, PromotionModalData, PromotionModalResult } from './components/promotion-modal/promotion-modal';
import { ManagementTab, ManagementViewModel } from '../../viewmodels/management.viewmodel';
import { discountLabel } from '../../../../core/services/promotions-api';

// vista de Gestión: los datos y las acciones están en ManagementViewModel; aquí quedan las
// pestañas, los modales y las confirmaciones
@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  providers: [ManagementViewModel],
  templateUrl: './management.html',
  styleUrl: './management.scss'
})
export class ManagementComponent implements OnInit {

  readonly vm = inject(ManagementViewModel);
  private readonly dialog = inject(MatDialog);

  tabs: { key: ManagementTab; icon: string }[] = [
    { key: 'users', icon: 'group' },
    { key: 'roles', icon: 'verified_user' },
    { key: 'services', icon: 'build' },
    { key: 'promotions', icon: 'local_offer' },
  ];

  ngOnInit(): void {
    this.vm.load();
  }

  // --- USUARIOS ---

  // el modal crea la cuenta y devuelve sus datos
  openCreateUser(): void {
    this.dialog.open(CreateUserModal, { panelClass: 'custom-dialog' })
      .afterClosed()
      .subscribe((created: CreateUserResult | null) => {
        if (created) this.vm.userCreated(created);
      });
  }

  toggleUserStatus(user: AdminUser): void {
    if (this.vm.disableBlockedKey(user)) return;
    const disabling = user.status === 'active';
    const data: ConfirmModalData = {
      title: disabling ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLE_TITLE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLE_TITLE',
      message: disabling ? 'ADMIN_MANAGEMENT.FEEDBACK.USER_DISABLE_MESSAGE' : 'ADMIN_MANAGEMENT.FEEDBACK.USER_ENABLE_MESSAGE',
      messageParams: { name: user.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: disabling,
    };
    this.confirm(data, () => this.vm.setUserActive(user, !disabling));
  }

  // --- ROLES: H-05, la matriz de permisos es solo de consulta (no hay acciones) ---

  // descuento de la tarjeta: "10%" o "$5.000" (D-01)
  discountText(promotion: Promotion): string {
    return discountLabel(promotion);
  }

  // --- SERVICIOS (booking-service) ---

  // tarifa que se muestra en la tabla: la del automóvil (tipo 1) o, si no tiene, la primera
  referencePrice(service: CatalogServiceResponse): ServicePriceResponse | null {
    return service.prices.find(p => p.vehicleTypeId === 1) ?? service.prices[0] ?? null;
  }

  openCreateService(): void {
    const data: ServiceModalData = { categories: this.vm.categories(), vehicleTypes: this.vm.vehicleTypes() };
    this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: ServiceModalResult | null) => {
        if (result) this.vm.createService(result);
      });
  }

  openEditService(service: CatalogServiceResponse): void {
    const data: ServiceModalData = { service, categories: this.vm.categories(), vehicleTypes: this.vm.vehicleTypes() };
    this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: ServiceModalResult | null) => {
        if (result) this.vm.updateService(service, result);
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
    this.confirm(data, () => this.vm.setServiceActive(service, activating));
  }

  deleteService(service: CatalogServiceResponse): void {
    this.confirmDelete(() => this.vm.deleteService(service));
  }

  // --- PROMOCIONES ---

  openCreatePromotion(): void {
    this.dialog.open(PromotionModal, { panelClass: 'custom-dialog' })
      .afterClosed()
      .subscribe((result: PromotionModalResult | null) => {
        if (result) this.vm.createPromotion(result);
      });
  }

  openEditPromotion(promotion: Promotion): void {
    const data: PromotionModalData = { promotion };
    this.dialog.open(PromotionModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: PromotionModalResult | null) => {
        if (result) this.vm.updatePromotion(promotion, result);
      });
  }

  // "Comenzar ahora" no pregunta; "Pausar" sí
  togglePromotion(promotion: Promotion): void {
    if (promotion.status !== 'active') {
      this.vm.setPromotionActive(promotion, true);
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
    this.confirm(data, () => this.vm.setPromotionActive(promotion, false));
  }

  deletePromotion(promotion: Promotion): void {
    this.confirmDelete(() => this.vm.deletePromotion(promotion));
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // --- confirmación compartida para borrar cualquier registro de las tablas ---
  private confirmDelete(onConfirm: () => void): void {
    this.confirm({
      title: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.TITLE',
      message: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.MESSAGE',
      confirmText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CONFIRM',
      cancelText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CANCEL',
      danger: true
    }, onConfirm);
  }

  private confirm(data: ConfirmModalData, onConfirm: () => void): void {
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) onConfirm();
      });
  }
}
