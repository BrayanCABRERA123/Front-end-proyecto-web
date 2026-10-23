import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

/**
 * Fotos del reporte de inspección (operations-service). Las del enlace público se muestran con
 * su url directa; las del admin exigen sesión, así que se piden con el token y se muestran como
 * url temporal (blob:), guardada para no volver a pedir la misma foto.
 */
@Injectable({ providedIn: 'root' })
export class InspectionPhotoService {

  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Promise<string>>();

  /** url que se puede poner en un <img>; null si la foto ya no existe */
  async url(path: string, secure: boolean): Promise<string | null> {
    const full = `${API_BASE_URL}${path}`;
    if (!secure) return full;

    let pending = this.cache.get(full);
    if (!pending) {
      pending = firstValueFrom(this.http.get(full, { responseType: 'blob' })).then(blob => URL.createObjectURL(blob));
      this.cache.set(full, pending);
      // si falla se olvida, para reintentar la próxima vez
      pending.catch(() => this.cache.delete(full));
    }
    try {
      return await pending;
    } catch {
      return null;
    }
  }
}
