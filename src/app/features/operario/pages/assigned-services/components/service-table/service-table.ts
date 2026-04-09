import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-service-table',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './service-table.html',
  styleUrl: './service-table.scss'
})
export class ServiceTableComponent {

  // recibe la lista de servicios del padre
  @Input() servicios: any[] = [];

  // recibe el servicio seleccionado para resaltarlo
  @Input() servicioSeleccionado: any;

  // avisa al padre cuando el usuario selecciona un servicio
  @Output() serviceSelected = new EventEmitter<any>();

  // se ejecuta cuando el usuario hace clic en una fila
  onSelectService(servicio: any): void {
    this.serviceSelected.emit(servicio);
  }
}