import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { Credenciales, DatosRegistro } from '../models/credenciales.model';

// TODO: reemplazar la simulación por llamadas reales via Api cuando exista backend
const USUARIO_DEMO: Usuario = {
  nombre: 'Admin Demo',
  email: 'admin@gmail.com',
  telefono: '+57 300 000 0000',
  direccion: 'Calle Principal #123',
  miembroDesde: 'Enero 2026',
  rol: 'CLIENTE',
};

const CONTRASENA_DEMO = 'Admin123!';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly usuarioActual = signal<Usuario | null>(null);
  readonly usuario = this.usuarioActual.asReadonly();

  login(credenciales: Credenciales): Observable<Usuario> {
    const esValido =
      credenciales.correo === USUARIO_DEMO.email &&
      credenciales.contrasena === CONTRASENA_DEMO;

    if (!esValido) {
      return throwError(() => new Error('Correo o contraseña incorrectos')).pipe(delay(300));
    }

    return of(USUARIO_DEMO).pipe(
      delay(300),
      tap(usuario => this.usuarioActual.set(usuario))
    );
  }

  registrar(datos: DatosRegistro): Observable<Usuario> {
    const nuevoUsuario: Usuario = {
      nombre: datos.nombre,
      email: datos.correo,
      telefono: datos.telefono,
      direccion: '',
      miembroDesde: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      rol: 'CLIENTE',
    };

    return of(nuevoUsuario).pipe(delay(1000));
  }

  solicitarRecuperacion(correo: string): Observable<boolean> {
    return of(true).pipe(delay(500));
  }

  verificarCodigo(correo: string, codigo: string): Observable<boolean> {
    return of(codigo.length === 6).pipe(delay(500));
  }

  actualizarContrasena(correo: string, nuevaContrasena: string): Observable<boolean> {
    return of(true).pipe(delay(500));
  }

  logout(): void {
    this.usuarioActual.set(null);
  }

  estaAutenticado(): boolean {
    return this.usuarioActual() !== null;
  }
}
