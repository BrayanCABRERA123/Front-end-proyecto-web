import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class AdminProfileComponent implements OnInit {

  // datos del usuario administrador, tomados de la sesión (Auth)
  user = { name: '', email: '', phone: '', address: '', initials: '', memberSince: '' };

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return;

    this.user = {
      name: currentUser.nombre,
      email: currentUser.correo,
      phone: currentUser.telefono ?? '',
      address: '',
      initials: currentUser.iniciales,
      memberSince: new Date(currentUser.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    };
  }
}
