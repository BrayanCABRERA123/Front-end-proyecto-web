import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent {

  editando: boolean = false;

  toggleEditar() {
    this.editando = !this.editando;

    if (!this.editando) {
      console.log('Guardar cambios aquí');
    }
  }

  usuario = {
    nombre: 'Juan Díaz',
    email: 'juan@email.com',
    telefono: '+1234 567 890',
    direccion: 'Calle Principal #123'
  };
}