import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del client
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos el componente compartido de perfil
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';

// la tarjeta carga y guarda el perfil, y actualiza la sesión (ProfileViewModel)
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {}
