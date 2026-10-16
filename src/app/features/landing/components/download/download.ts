import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import QRCode from 'qrcode';

// lo que el servidor publica en /app/version.json (deploy/publish-apk.sh de lavarapido-infra)
interface PublishedApk {
  versionCode: number;
  url: string;
  sizeBytes?: number;
  publishedAt?: string;
}

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
export class DownloadComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly changes = inject(ChangeDetectorRef);

  apk: PublishedApk | null = null;
  downloadUrl = '';
  qrDataUrl = '';

  ngOnInit(): void {
    this.http.get<PublishedApk>('/app/version.json').subscribe({
      next: (apk) => {
        if (!apk?.url) return;
        this.apk = apk;
        // dirección completa: el QR se escanea desde otro dispositivo
        this.downloadUrl = new URL(apk.url, window.location.origin).toString();
        QRCode.toDataURL(this.downloadUrl, { width: 220, margin: 1 })
          .then((dataUrl) => {
            this.qrDataUrl = dataUrl;
            this.changes.markForCheck();
          })
          .catch(() => undefined);
        this.changes.markForCheck();
      },
      // sin APK publicado no se muestra la sección
      error: () => undefined
    });
  }

  get sizeLabel(): string {
    return this.apk?.sizeBytes ? `${Math.round(this.apk.sizeBytes / (1024 * 1024))} MB` : '';
  }
}
