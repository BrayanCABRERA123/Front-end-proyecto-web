import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del operario
import { SidebarOperarioComponent } from '../../../../layout/sidebar-operario/sidebar-operario';
// importamos el componente compartido de perfil
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarOperarioComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {

  // datos del usuario operario
  usuario = {
    nombre: 'Juan Díaz',
    email: 'juan@email.com',
    telefono: '+1234 567 890',
    direccion: 'Calle Principal #123',
    iniciales: 'JD',
    miembroDesde: 'Enero 2026'
  };
}