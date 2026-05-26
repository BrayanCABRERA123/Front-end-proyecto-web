import { Component, Input, Output, EventEmitter, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-service-modal',
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './service-modal.html',
  styleUrl: './service-modal.scss',
})
export class ServiceModal {
  @Input() servicio: string = '';
  @Output() cerrar = new EventEmitter<void>();
}
