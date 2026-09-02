import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AppNotification,
  NotificationType,
  claseTipoNotificacion,
  labelTipoNotificacion
} from '../../dialogs/notification-models/notification.model';
import { NotificationDetailModal } from '../../dialogs/notification-detail-modal/notification-detail-modal';
import { ConfirmModal, ConfirmModalData } from '../../dialogs/confirm-modal/confirm-modal';

export type { AppNotification, NotificationType };

type TabKey = 'todas' | 'recordatorio' | 'promocion' | 'confirmacion' | 'otras';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent {

  @Input() rol: 'CLIENTE' | 'OPERARIO' = 'CLIENTE';
  @Input() notifications: AppNotification[] = [];

  tabActiva: TabKey = 'todas';

  tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'todas',        icon: 'mail',          label: 'NOTIFICATIONS.TABS.ALL' },
    { key: 'recordatorio', icon: 'schedule',       label: 'NOTIFICATIONS.TABS.REMINDERS' },
    { key: 'promocion',    icon: 'sell',           label: 'NOTIFICATIONS.TABS.PROMOS' },
    { key: 'confirmacion', icon: 'check_circle',   label: 'NOTIFICATIONS.TABS.CONFIRMATIONS' },
    { key: 'otras',        icon: 'notifications',  label: 'NOTIFICATIONS.TABS.OTHERS' }
  ];

  cambiarTab(tab: TabKey) {
    this.tabActiva = tab;
  }

  private tabDeTipo(tipo: NotificationType): TabKey {
    if (tipo === 'recordatorio') return 'recordatorio';
    if (tipo === 'promocion') return 'promocion';
    if (tipo === 'confirmacion') return 'confirmacion';
    return 'otras';
  }

  estadoInput: 'todas' | 'leidas' | 'no-leidas' = 'todas';
  fechaDesdeInput = '';
  fechaHastaInput = '';

  private estadoAplicado: 'todas' | 'leidas' | 'no-leidas' = 'todas';
  private fechaDesdeAplicada = '';
  private fechaHastaAplicada = '';

  aplicarFiltros() {
    this.estadoAplicado = this.estadoInput;
    this.fechaDesdeAplicada = this.fechaDesdeInput;
    this.fechaHastaAplicada = this.fechaHastaInput;
  }

  resetFiltros() {
    this.estadoInput = 'todas';
    this.fechaDesdeInput = '';
    this.fechaHastaInput = '';
    this.aplicarFiltros();
  }

  contarNoLeidas(tab: TabKey): number {
    return this.notifications.filter(n =>
      !n.read && (tab === 'todas' || this.tabDeTipo(n.type) === tab)
    ).length;
  }

  get totalNoLeidas(): number {
    return this.contarNoLeidas('todas');
  }

  get notificacionesFiltradas(): AppNotification[] {
    return this.notifications.filter(n => {

      if (this.tabActiva !== 'todas' && this.tabDeTipo(n.type) !== this.tabActiva) {
        return false;
      }

      if (this.estadoAplicado === 'leidas' && !n.read) return false;
      if (this.estadoAplicado === 'no-leidas' && n.read) return false;

      if (this.fechaDesdeAplicada && n.date < this.fechaDesdeAplicada) return false;
      if (this.fechaHastaAplicada && n.date > this.fechaHastaAplicada) return false;

      return true;
    });
  }

  marcarLeido(n: AppNotification) {
    n.read = true;
  }

  marcarNoLeido(n: AppNotification) {
    n.read = false;
  }

  marcarTodoComoLeido() {
    this.notifications.forEach(n => n.read = true);
  }

  constructor(private dialog: MatDialog) {}

  verDetalle(n: AppNotification) {
    this.dialog.open(NotificationDetailModal, {
      panelClass: 'custom-dialog',
      data: n
    });
  }

  pedirEliminar(n: AppNotification) {
    const data: ConfirmModalData = {
      titulo: 'NOTIFICATIONS.DELETE_TITLE',
      mensaje: 'NOTIFICATIONS.DELETE_MESSAGE'
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.notifications = this.notifications.filter(x => x.id !== n.id);
      }
    });
  }

  claseTipo = claseTipoNotificacion;
  labelTipo = labelTipoNotificacion;
}