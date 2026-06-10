import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [TranslateModule], 
  // CUSTOM_ELEMENTS_SCHEMA le dice a Angular que acepte
  // etiquetas HTML personalizadas como <iconify-icon>
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss'
})
export class AuthCardComponent {}