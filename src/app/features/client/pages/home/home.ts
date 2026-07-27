// definimos el componente
import { Component, OnInit } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { HomeViewModel } from './home.viewmodel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  providers: [HomeViewModel],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {

  // accesos directos a los íconos de la cabecera (no es un dato de negocio)
  notificaciones = [
    {
      camp: 'notifications', ruta: 'notifications',
    },
  ];

  //CONSTRUCTOR
  constructor(
    public vm: HomeViewModel,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.vm.cargar();
  }

  // METODO
  irA(ruta: string | null | undefined) {
    if (ruta) {
      this.router.navigate(['/client', ruta]);
    }
  }

}