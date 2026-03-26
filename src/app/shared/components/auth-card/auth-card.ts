import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  // CUSTOM_ELEMENTS_SCHEMA le dice a Angular que acepte
  // etiquetas HTML personalizadas como <iconify-icon>
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss'
})
export class AuthCardComponent {}