import { Injectable } from '@angular/core';

// Fotos del reporte de inspección guardadas en IndexedDB.
//
// localStorage solo admite ~5 MB y se llenaría con 3 o 4 fotos; IndexedDB guarda Blobs
// sin convertirlos a texto. Cuando exista el backend las fotos se suben con multipart
// y este servicio desaparece.

const DB_NAME = 'lavarapido-inspections';
const STORE = 'photos';

@Injectable({ providedIn: 'root' })
export class PhotoStorageService {

  private dbPromise: Promise<IDBDatabase> | null = null;

  // urls ya creadas, para no generar una nueva cada vez que se pinta la foto
  private urlCache = new Map<string, string>();

  async save(blob: Blob): Promise<string> {
    const id = crypto.randomUUID();
    await this.request('readwrite', store => store.put(blob, id));
    return id;
  }

  /** url temporal (blob:) para mostrar la foto; null si ya no existe */
  async url(id: string): Promise<string | null> {
    const cached = this.urlCache.get(id);
    if (cached) return cached;

    const blob = await this.request<Blob | undefined>('readonly', store => store.get(id));
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    this.urlCache.set(id, url);
    return url;
  }

  async remove(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.request('readwrite', store => store.delete(id));
      const url = this.urlCache.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        this.urlCache.delete(id);
      }
    }
  }

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          // si el navegador bloquea IndexedDB se vuelve a intentar en la próxima llamada
          this.dbPromise = null;
          reject(req.error);
        };
      });
    }
    return this.dbPromise;
  }

  private async request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const req = action(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }
}
