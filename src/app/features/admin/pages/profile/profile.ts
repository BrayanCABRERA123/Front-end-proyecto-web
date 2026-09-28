import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ProfileCardComponent, ProfileSaveData } from '../../../../shared/components/profile-card/profile-card';
// usuario de la sesión: el mismo que muestra el sidebar
import { UserSession } from '../../../../core/services/user-session';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class AdminProfileComponent {

  // datos del usuario admin (se recalcula solo cuando cambian en la sesión)
  user = computed(() => ({
    ...this.session.user(),
    initials: this.session.initials()
  }));

  constructor(private session: UserSession) {}

  // guarda los cambios del perfil; el sidebar se actualiza automáticamente
  onSaved(data: ProfileSaveData): void {
    this.session.update(data);
  }
}