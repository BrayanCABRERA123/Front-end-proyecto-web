import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// lo que el servidor publica en /app/version.json (deploy/publish-apk.sh de lavarapido-infra)
export interface PublishedApk {
  versionCode: number;
  url: string;
  sizeBytes?: number;
  publishedAt?: string;
}

// APK de la app Android que sirve el mismo servidor de la web (no pasa por el gateway)
@Injectable({ providedIn: 'root' })
export class AppReleaseService {

  private readonly http = inject(HttpClient);

  latestApk(): Observable<PublishedApk> {
    return this.http.get<PublishedApk>('/app/version.json');
  }
}
