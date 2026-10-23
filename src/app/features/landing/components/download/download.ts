import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { LandingViewModel } from '../../viewmodels/landing.viewmodel';

/**
 * Descarga de la app Android desde la web: botón y código QR para escanear con el celular.
 * El APK lo sirve el mismo servidor en una dirección fija (/app/LavaRapidoVehicular.apk). Si todavía
 * no hay uno publicado (ej. desarrollo local), la sección no aparece.
 */
@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './download.html',
  styleUrl: './download.scss'
})
export class DownloadComponent {

  readonly vm = inject(LandingViewModel);
}
