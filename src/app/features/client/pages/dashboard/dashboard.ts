// definimos el componente
import { Component, OnInit, inject } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable que también muestra una lista de detalles
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
import { LongDatePipe } from '../../../../shared/pipes/long-date.pipe';
import { ClientDashboardViewModel } from '../../viewmodels/dashboard.viewmodel';

// vista del inicio del cliente: los datos están en ClientDashboardViewModel
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, LongDatePipe],
  providers: [ClientDashboardViewModel],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {

  readonly vm = inject(ClientDashboardViewModel);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  readonly today = new Date();

  notifications = [
    { icon: 'notifications', route: 'notifications' },
  ];

  quickAccess = [
    { icon: 'calendar_today', label: 'QUICK_ACCESS.BOOK_WASH', route: 'reserve' },
    { icon: 'credit_card', label: 'QUICK_ACCESS.PAY_SERVICE', route: 'history' },
    { icon: 'directions_car', label: 'QUICK_ACCESS.MY_VEHICLES', route: 'vehicles' },
    { icon: 'notifications', label: 'QUICK_ACCESS.NOTIFICATIONS', route: 'notifications' }
  ];

  ngOnInit(): void {
    this.vm.load();
  }

  goTo(route: string | null | undefined) {
    if (route) {
      this.router.navigate(['/client', route]);
    }
  }

  // detalle del próximo servicio en el modal de estado (tipo info)
  viewNextServiceDetail() {
    const service = this.vm.nextService();
    if (!service) return;

    const data: StatusModalData = {
      type: 'info',
      icon: 'event',
      title: 'DASHBOARD.NEXT_SERVICE.TITLE',
      message: 'DASHBOARD.NEXT_SERVICE.DETAIL_MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'RESERVE.SUMMARY.SERVICE', value: service.serviceName },
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${service.vehicle} · ${service.plate}`.trim() },
        { label: 'RESERVE.SUMMARY.DATE', value: service.date },
        { label: 'RESERVE.SUMMARY.CAR_WASH', value: this.vm.location()?.address ?? '' },
        { label: 'DASHBOARD.NEXT_SERVICE.OPERATOR_ASSIGNED', value: service.operator || '—' },
        { label: 'DASHBOARD.NEXT_SERVICE.STATUS', value: this.translate.instant(`STATUS.${service.status}`) },
        { label: 'DASHBOARD.NEXT_SERVICE.PROGRESS', value: `${this.vm.nextServiceProgress()}%` }
      ]
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
