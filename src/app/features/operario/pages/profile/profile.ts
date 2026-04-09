import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del operario
import { SidebarOperarioComponent } from '../../../../layout/sidebar-operario/sidebar-operario';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
      CommonModule,
      SidebarOperarioComponent,
      MatIconModule
    ],
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
