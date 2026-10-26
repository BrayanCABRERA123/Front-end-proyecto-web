import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AssignedServicesViewModel } from '../../viewmodels/assigned-services.viewmodel';
import { OperatorWorkViewModel } from '../../viewmodels/operator-work.viewmodel';
import { WAITING_POLL_MS, keepFresh } from '../../../../core/services/live-refresh';

// vista de Servicios asignados: el estado y las acciones están en AssignedServicesViewModel
@Component({
  selector: 'app-assigned-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ServiceTableComponent,
    ServiceDetailComponent,
    MatIconModule,
    TranslateModule
  ],
  providers: [AssignedServicesViewModel, OperatorWorkViewModel],
  templateUrl: './assigned-services.html',
  styleUrl: './assigned-services.scss'
})
export class AssignedServicesComponent implements OnInit {

  readonly vm = inject(AssignedServicesViewModel);

  // datos frescos sin recargar (WEB-16): al volver a la pestaña, con cada notificación nueva y cada
  // tanto mientras la pestaña esté visible, porque esta vista espera a otra persona
  constructor() {
    keepFresh(silent => this.vm.load(silent), { pollMs: WAITING_POLL_MS, initial: false });
  }

  ngOnInit(): void {
    this.vm.load();
  }
}
