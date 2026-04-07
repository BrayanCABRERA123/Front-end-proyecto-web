import { Component } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule],
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
}
