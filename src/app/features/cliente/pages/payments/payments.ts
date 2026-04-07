import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, SidebarComponent, MatIconModule],
  templateUrl: './payments.html',
  styleUrl: './payments.scss',
})
export class Payments {}
