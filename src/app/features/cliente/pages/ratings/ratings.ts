import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ratings',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.scss',
})
export class RatingsComponent {

  rating: number = 0;

  calificar(valor: number) {
    this.rating = valor;
  }

}
