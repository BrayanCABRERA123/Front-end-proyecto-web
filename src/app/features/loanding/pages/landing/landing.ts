import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent {

  // características que se muestran en la sección "¿Por qué elegirnos?"
  features = [
  {
    icono: 'water_drop',
    titulo: 'FEATURES.ITEMS.ECO.TITLE',
    descripcion: 'FEATURES.ITEMS.ECO.DESC'
  },
  {
    icono: 'shield',
    titulo: 'FEATURES.ITEMS.PROTECTION.TITLE',
    descripcion: 'FEATURES.ITEMS.PROTECTION.DESC'
  },
  {
    icono: 'star',
    titulo: 'FEATURES.ITEMS.RATING.TITLE',
    descripcion: 'FEATURES.ITEMS.RATING.DESC'
  }
];
}