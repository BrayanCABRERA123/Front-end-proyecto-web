import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent {

  // características que se muestran en la sección "¿Por qué elegirnos?"
  features = [
    {
      icono: 'water_drop',
      titulo: 'Lavado Ecológic',
      descripcion: 'Usamos productos biodegradable'
    },
    {
      icono: 'shield',
      titulo: 'Protección Total',
      descripcion: 'Cuidamos cada detalle de tu auto'
    },
    {
      icono: 'star',
      titulo: '5 Estrellas',
      descripcion: 'Calidad garantizada siempre'
    }
  ];
}