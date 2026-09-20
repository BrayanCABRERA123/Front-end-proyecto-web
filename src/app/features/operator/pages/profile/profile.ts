import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar 
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos el componente compartido de perfil
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {

  // datos del usuario operator
  user = {
    name: 'Juan Díaz',
    email: 'juan@email.com',
    phone: '+1234 567 890',
    address: 'Calle Principal #123',
    initials: 'JD',
    memberSince: 'Enero 2026'
  };
}