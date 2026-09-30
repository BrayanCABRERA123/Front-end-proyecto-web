import { Injectable, computed, signal } from '@angular/core';

// datos del usuario que tiene la sesión abierta (vienen del login real)
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
}

// usuario vacío mientras no hay sesión (nada de datos de prueba)
const EMPTY_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  memberSince: ''
};

// misma llave que borra el cierre de sesión (sidebar y eliminar cuenta)
const STORAGE_KEY = 'user';

// guarda el usuario en un solo lugar para que perfil y sidebar muestren lo mismo.
// los datos reales llegan del login (AuthService.store) y se pueden actualizar con PATCH /users/me
@Injectable({
  providedIn: 'root'
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

  // lee el usuario guardado o usa el vacío si no hay nada
  private load(): UserProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY_USER, ...JSON.parse(saved) } : EMPTY_USER;
    } catch {
      return EMPTY_USER;
    }
  }
}
