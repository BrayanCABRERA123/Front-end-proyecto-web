import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class AdminProfileComponent {

  // datos del usuario administrador (según los mockups aprobados)
  usuario = {
    nombre: 'Laura Méndez',
    email: 'laura.mendez@lavadovehicular.co',
    telefono: '+57 312 490 8821',
    direccion: 'Calle 127 #19A-48, Bogotá, Colombia',
    iniciales: 'LM',
    miembroDesde: 'Marzo 2019'
  };
}
