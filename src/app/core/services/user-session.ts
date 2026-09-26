import { Injectable, computed, signal } from '@angular/core';

// datos del usuario que tiene la sesión abierta
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
}

// misma llave que borra el cierre de sesión (sidebar y eliminar cuenta)
const STORAGE_KEY = 'user';

// usuario de prueba mientras no hay backend
const DEFAULT_USER: UserProfile = {
  name: 'Juan Díaz',
  email: 'juan@email.com',
  phone: '+57 3001234567',
  address: 'Calle Principal #123',
  memberSince: 'Enero 2026'
};

// guarda el usuario en un solo lugar para que perfil y sidebar muestren lo mismo
// TODO: reemplazar localStorage por el backend cuando esté conectado
@Injectable({
  providedIn: 'root',
})
export class UserSession {

  private readonly userSignal = signal<UserProfile>(this.load());

  // usuario actual (solo lectura para los componentes)
  readonly user = this.userSignal.asReadonly();

  // iniciales a partir del nombre (ej. "Juan Díaz" -> "JD")
  readonly initials = computed(() =>
    this.userSignal().name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('')
  );

  // actualiza los datos del usuario y los deja guardados
  update(changes: Partial<UserProfile>): void {
    const updated = { ...this.userSignal(), ...changes };
    this.userSignal.set(updated);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // si el navegador no permite guardar, el cambio queda solo en memoria
    }
  }

  // lee el usuario guardado o usa el de prueba si no hay nada
  private load(): UserProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_USER, ...JSON.parse(saved) } : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }
}
