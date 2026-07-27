import { Injectable, computed, signal } from '@angular/core';
import { Usuario, obtenerIniciales } from '../../../../core/models/usuario.model';
import { OperatorService } from '../../services/operator';

@Injectable()
export class OperatorProfileViewModel {

  private readonly usuarioBase = signal<Usuario | null>(null);

  readonly usuario = computed(() => {
    const usuario = this.usuarioBase();
    if (!usuario) return null;

    return {
      ...usuario,
      iniciales: obtenerIniciales(usuario.nombre)
    };
  });

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getUsuario().subscribe(usuario => this.usuarioBase.set(usuario));
  }
}
