import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { LandingViewModel } from '../../viewmodels/landing.viewmodel';

// tarjetas de contacto: los datos del negocio los trae LandingViewModel
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent {

  readonly vm = inject(LandingViewModel);
}
