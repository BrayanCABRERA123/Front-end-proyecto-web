import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { StatsCardComponent } from './components/stats-card/stats-card';
import { PendingServiceCardComponent } from './components/pending-service-card/pending-service-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import { Reservation } from '../../../../shared/dialogs/reservation-models/reservation.model';
import { LongDatePipe } from '../../../../shared/pipes/long-date.pipe';
import { OperatorHomeViewModel } from '../../viewmodels/home.viewmodel';
import { OperatorWorkViewModel } from '../../viewmodels/operator-work.viewmodel';
import { confirmFinish, confirmStart } from '../../components/work-confirm';

// vista del Inicio del operario: el estado y las acciones están en OperatorHomeViewModel
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    PendingServiceCardComponent,
    MatIconModule,
    TranslateModule,
    LongDatePipe
  ],
  providers: [OperatorHomeViewModel, OperatorWorkViewModel],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {

  readonly vm = inject(OperatorHomeViewModel);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly today = new Date();

  ngOnInit(): void {
    this.vm.load();
  }

  goTo(route: string) {
    this.router.navigateByUrl(route);
  }

  // el botón dice "Ver servicios asignados", así que lleva a esa pantalla
  goToAssignedServices() {
    this.router.navigateByUrl('/operator/assigned-services');
  }

  // pide confirmación antes de iniciar (igual que al finalizar)
  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;
    confirmStart(this.dialog, r.code).subscribe(confirmed => {
      if (confirmed) this.vm.start(r);
    });
  }

  requestFinish(r: Reservation) {
    confirmFinish(this.dialog, r.code).subscribe(confirmed => {
      if (confirmed) this.vm.finish(r);
    });
  }

  viewDetail(r: Reservation) {
    const dialogRef = this.dialog.open(ReservationDetailModal, {
      panelClass: 'custom-dialog',
      data: r
    });

    dialogRef.afterClosed().subscribe(action => {
      if (action === 'start') {
        this.startService(r);
      } else if (action === 'finish') {
        this.requestFinish(r);
      }
    });
  }
}
