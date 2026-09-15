// definimos el componente de administración de usuarios
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserModalComponent, NuevoUsuario, TipoUsuario } from './components/user-modal/user-modal';

// estados posibles de un usuario dentro del sistema
type EstadoUsuario = 'ACTIVE' | 'PENDING' | 'DISABLED';

// pestañas disponibles para filtrar la lista de usuarios
type TabUsuarios = 'HABILITADOS' | 'REGISTRADOS' | 'INHABILITADOS';

// estructura de un usuario
interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  tipoUsuario: TipoUsuario;
  fecha: string;
  invitado: boolean;
  estado: EstadoUsuario;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, UserModalComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent {

  // pestaña activa actualmente
  tabActiva: TabUsuarios = 'HABILITADOS';

  // texto de búsqueda por nombre o correo
  busqueda = '';

  // controla la visibilidad del modal de creación de usuario
  modalAbierto = false;

  // listado de usuarios (mock, se reemplaza luego con datos del backend)
  usuarios: Usuario[] = [
    { id: 'U001', nombre: 'Uziel Loranca Cantoral', correo: 'nathan.roberts@example.com', tipoUsuario: 'ADMIN', fecha: '2023-02-07', invitado: false, estado: 'ACTIVE' },
    { id: 'U002', nombre: 'Iver Avedillo Herbias', correo: 'deanna.curtis@example.com', tipoUsuario: 'ADMIN', fecha: '2023-08-15', invitado: true, estado: 'ACTIVE' },
    { id: 'U003', nombre: 'Aguilda Lloredo Ruifrancos', correo: 'debbie.baker@example.com', tipoUsuario: 'ADMIN', fecha: '2023-03-03', invitado: false, estado: 'ACTIVE' },
    { id: 'U004', nombre: 'Marcos Pérez Solís', correo: 'marcos.perez@example.com', tipoUsuario: 'OPERATOR', fecha: '2023-05-21', invitado: false, estado: 'PENDING' }
  ];

  // cantidad de usuarios habilitados (activos)
  get totalHabilitados(): number {
    return this.usuarios.filter(u => u.estado === 'ACTIVE').length;
  }

  // cantidad de usuarios registrados (pendientes de aprobación)
  get totalRegistrados(): number {
    return this.usuarios.filter(u => u.estado === 'PENDING').length;
  }

  // cantidad de usuarios inhabilitados
  get totalInhabilitados(): number {
    return this.usuarios.filter(u => u.estado === 'DISABLED').length;
  }

  // lista filtrada según la pestaña activa y el texto de búsqueda
  get usuariosFiltrados(): Usuario[] {
    const estadoPorTab: Record<TabUsuarios, EstadoUsuario> = {
      HABILITADOS: 'ACTIVE',
      REGISTRADOS: 'PENDING',
      INHABILITADOS: 'DISABLED'
    };
    const estado = estadoPorTab[this.tabActiva];
    const texto = this.busqueda.trim().toLowerCase();

    return this.usuarios.filter(usuario => {
      const coincideEstado = usuario.estado === estado;
      const coincideBusqueda = !texto
        || usuario.nombre.toLowerCase().includes(texto)
        || usuario.correo.toLowerCase().includes(texto);
      return coincideEstado && coincideBusqueda;
    });
  }

  // cambia la pestaña activa
  cambiarTab(tab: TabUsuarios): void {
    this.tabActiva = tab;
  }

  // abre el modal para crear un nuevo usuario
  abrirModal(): void {
    this.modalAbierto = true;
  }

  // cierra el modal sin guardar
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // recibe el usuario emitido por el modal y lo agrega a la lista
  onCrearUsuario(nuevoUsuario: NuevoUsuario): void {
    const nuevoId = 'U' + String(this.usuarios.length + 1).padStart(3, '0');
    this.usuarios = [
      {
        id: nuevoId,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        tipoUsuario: nuevoUsuario.tipoUsuario,
        fecha: new Date().toISOString().slice(0, 10),
        invitado: nuevoUsuario.invitar,
        estado: 'PENDING'
      },
      ...this.usuarios
    ];
    // TODO: reemplazar con la llamada real al backend para crear el usuario
    this.modalAbierto = false;
  }

  // edita un usuario existente
  editarUsuario(usuario: Usuario): void {
    // TODO: abrir modal de edición con los datos del usuario
    console.log('Editar usuario', usuario);
  }

  // elimina un usuario de la lista
  eliminarUsuario(usuario: Usuario): void {
    // TODO: integrar con el backend para eliminar el usuario
    this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
  }

  // abre el panel de filtros avanzados
  // alterna el estado de un usuario entre activo e inhabilitado
  toggleEstadoUsuario(usuario: Usuario): void {
    usuario.estado = usuario.estado === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
  }

  abrirFiltros(): void {
    // TODO: implementar filtros avanzados (tipo de usuario, fecha, invitado)
    console.log('Abrir filtros de usuarios');
  }
}
