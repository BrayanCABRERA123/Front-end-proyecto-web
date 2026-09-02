// definimos el componente de gestión de roles
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { RoleModalComponent, NuevoRol } from './components/role-modal/role-modal';

// estados posibles de un rol
type EstadoRol = 'ACTIVE' | 'INACTIVE';

// estructura de un rol del sistema
interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  usuariosCount: number;
  permisosCount: number;
  estado: EstadoRol;
  fecha: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, RoleModalComponent],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class RolesComponent {

  // texto de búsqueda por nombre de rol
  busqueda = '';

  // controla la visibilidad del modal de creación de rol
  modalAbierto = false;

  // listado de roles (mock, se reemplaza luego con datos del backend)
  roles: Rol[] = [
    { id: 'R001', nombre: 'Administrador', descripcion: 'Control total del sistema', usuariosCount: 1, permisosCount: 1, estado: 'ACTIVE', fecha: '2024-01-15' },
    { id: 'R002', nombre: 'Operador', descripcion: 'Puede editar contenido', usuariosCount: 10, permisosCount: 10, estado: 'ACTIVE', fecha: '2024-02-20' },
    { id: 'R003', nombre: 'Supervisor', descripcion: 'Solo lectura', usuariosCount: 5, permisosCount: 5, estado: 'ACTIVE', fecha: '2024-03-10' }
  ];

  // lista de roles filtrada por el texto de búsqueda
  get rolesFiltrados(): Rol[] {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      return this.roles;
    }
    return this.roles.filter(rol =>
      rol.nombre.toLowerCase().includes(texto)
      || rol.descripcion.toLowerCase().includes(texto)
    );
  }

  // abre el modal para crear un nuevo rol
  abrirModal(): void {
    this.modalAbierto = true;
  }

  // cierra el modal sin guardar
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // recibe el rol emitido por el modal y lo agrega a la lista
  onCrearRol(nuevoRol: NuevoRol): void {
    const nuevoId = 'R' + String(this.roles.length + 1).padStart(3, '0');
    this.roles = [
      ...this.roles,
      {
        id: nuevoId,
        nombre: nuevoRol.nombre,
        descripcion: nuevoRol.descripcion,
        usuariosCount: 0,
        permisosCount: nuevoRol.permisos.length,
        estado: 'ACTIVE',
        fecha: new Date().toISOString().slice(0, 10)
      }
    ];
    // TODO: reemplazar con la llamada real al backend para crear el rol
    this.modalAbierto = false;
  }

  // edita un rol existente
  editarRol(rol: Rol): void {
    // TODO: abrir modal de edición con los datos del rol
    console.log('Editar rol', rol);
  }

  // elimina un rol de la lista
  eliminarRol(rol: Rol): void {
    // TODO: integrar con el backend para eliminar el rol
    this.roles = this.roles.filter(r => r.id !== rol.id);
  }

  // abre el panel de filtros avanzados
  // alterna el estado de un rol entre activo e inactivo
  toggleEstadoRol(rol: Rol): void {
    rol.estado = rol.estado === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }

  abrirFiltros(): void {
    // TODO: implementar filtros avanzados de roles
    console.log('Abrir filtros de roles');
  }
}
