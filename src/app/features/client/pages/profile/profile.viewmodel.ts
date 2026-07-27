import { Injectable, computed, signal } from '@angular/core';
import { Usuario, obtenerIniciales } from '../../../../core/models/usuario.model';
import { ClientService } from '../../services/client';

@Injectable()
export class ProfileViewModel {

  private readonly usuarioBase = signal<Usuario | null>(null);

  // objeto listo para pasarle a app-profile-card, incluye las iniciales derivadas
  readonly usuario = computed(() => {
    const usuario = this.usuarioBase();
    if (!usuario) return null;

    return {
      ...usuario,
      iniciales: obtenerIniciales(usuario.nombre)
    };
  });

  constructor(private clientService: ClientService) {}

  cargar(): void {
    this.clientService.getUsuario().subscribe(usuario => this.usuarioBase.set(usuario));
  }
}
