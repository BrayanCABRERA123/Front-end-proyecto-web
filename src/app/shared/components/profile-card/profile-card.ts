import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
// importamos el módulo de traducción
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss'
})
export class ProfileCardComponent {

  // recibe los datos del usuario desde el padre
  @Input() usuario = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    iniciales: '',
    miembroDesde: ''
  };

  // controla si el formulario está en modo edición
  editando: boolean = false;

  // alterna entre editar y guardar
  toggleEditar(): void {
    this.editando = !this.editando;
    if (!this.editando) {
      console.log('Guardar cambios aquí');
    }
  }
}