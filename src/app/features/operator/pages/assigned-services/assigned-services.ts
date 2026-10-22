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

  ngOnInit(): void {
    this.vm.load();
  }
}
