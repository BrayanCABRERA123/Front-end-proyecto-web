import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './payments.html',
  styleUrl: './payments.scss',
})
export class Payments {}
