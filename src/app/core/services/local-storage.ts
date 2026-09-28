// Acceso seguro a localStorage.
//
// Todas las pantallas mock guardan sus cambios para que el estado sobreviva a una
// recarga, igual que ya lo hacen el tema, el idioma y la sesión. Este helper
// centraliza el try/catch porque el navegador puede bloquear el almacenamiento
// (modo privado, permisos de la empresa) y en ese caso la app debe seguir
// funcionando solo con memoria.

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // si el navegador no permite guardar, el cambio queda solo en memoria
  }
}
