import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// importamos el formulario que está dentro de esta misma página
import { CarWashFormComponent } from './components/car-wash-form/car-wash-form';

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,     // menú izquierdo
    CarWashFormComponent  // formulario de reserva
  ],
  templateUrl: './reserve.html',
  styleUrl: './reserve.scss'
})
export class ReserveComponent {}