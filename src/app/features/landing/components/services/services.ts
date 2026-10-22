import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
// el precio sale del catálogo del booking-service; aquí solo se formatea
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import { LandingViewModel } from '../../viewmodels/landing.viewmodel';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent {

  readonly vm = inject(LandingViewModel);
}
