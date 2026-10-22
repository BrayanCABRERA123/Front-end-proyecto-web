import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';

// la tarjeta carga y guarda el perfil, y actualiza la sesión (ProfileViewModel)
@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class AdminProfileComponent {}
