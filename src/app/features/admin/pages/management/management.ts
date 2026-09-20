import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { CreateUserModal, CreateUserResult } from '../../../../shared/dialogs/create-user-modal/create-user-modal';
import { CreateRoleModal, CreateRoleResult } from '../../../../shared/dialogs/create-role-modal/create-role-modal';
import { ServiceModal, ServiceModalData, ServiceModalResult } from '../../../../shared/dialogs/service-modal/service-modal';

type ManagementTab = 'users' | 'roles' | 'services' | 'promotions';

// --- pestaña Usuarios ---
interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  dateAdded: string;
  invited: boolean;
  status: 'active' | 'disabled';
}

// --- pestaña Roles ---
interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
}

// --- pestaña Servicios ---
interface CatalogService {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  category: string;
  status: 'active' | 'inactive';
}

// --- pestaña Promociones ---
interface Promotion {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  couponCode: string;
  redemptions: number;
  featured: boolean;
  features: string[];
  icon: string;
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './management.html',
  styleUrl: './management.scss'
})
export class ManagementComponent {

  activeTab: ManagementTab = 'users';

  tabs: { key: ManagementTab; icon: string }[] = [
    { key: 'users', icon: 'group' },
    { key: 'roles', icon: 'verified_user' },
    { key: 'services', icon: 'build' },
    { key: 'promotions', icon: 'local_offer' },
  ];

  userFilter: 'enabled' | 'registered' | 'disabled' = 'enabled';
  usersSearch = '';

  users: AdminUser[] = [
    { id: 'u1', name: 'Uziel Loranca Cantoral', email: 'nathan.roberts@example.com', userType: 'Administrador', dateAdded: '2023-02-07', invited: false, status: 'active' },
    { id: 'u2', name: 'Iver Avedillo Herbias', email: 'deanna.curtis@example.com', userType: 'Administrador', dateAdded: '2023-08-15', invited: true, status: 'active' },
    { id: 'u3', name: 'Aguilda Lloredo Ruifrancos', email: 'debbie.baker@example.com', userType: 'Administrador', dateAdded: '2023-03-03', invited: false, status: 'active' },
  ];

  roles: UserRole[] = [
    { id: 'r1', name: 'Administrador', description: 'Acceso total a todos los paneles y operaciones del negocio.', permissions: ['view_panels', 'create_records', 'edit_data', 'delete'], usersCount: 3 },
    { id: 'r2', name: 'Supervisor de Bahía', description: 'Gestiona turnos, asignaciones y disponibilidad de operarios.', permissions: ['view_panels', 'create_records', 'edit_data'], usersCount: 0 },
    { id: 'r3', name: 'Soporte', description: 'Consulta reservas y pagos para atender solicitudes de clientes.', permissions: ['view_panels'], usersCount: 0 },
  ];

  services: CatalogService[] = [
    { id: 's1', name: 'Encerado', price: 150000, durationMin: 45, category: 'brillado', status: 'active' },
    { id: 's2', name: 'Lavado básico', price: 80000, durationMin: 30, category: 'lavado', status: 'active' },
    { id: 's3', name: 'Lavado completo', price: 250000, durationMin: 60, category: 'lavado', status: 'inactive' },
    { id: 's4', name: 'Pulido premium', price: 320000, durationMin: 90, category: 'brillado', status: 'active' },
  ];

  promotions: Promotion[] = [
    {
      id: 'p1', name: 'Básico', description: 'Lavado exterior del vehículo', price: 20000, durationMin: 45,
      couponCode: 'BASICO20', redemptions: 412, featured: false, icon: 'directions_car',
      features: ['Lavado exterior completo', 'Aspirado básico', 'Limpieza de vidrios']
    },
    {
      id: 'p2', name: 'Premium', description: 'Lavado completo con encerado', price: 35000, durationMin: 75,
      couponCode: 'PREMIUM35', redemptions: 890, featured: true, icon: 'water_drop',
      features: ['Todo lo del Básico', 'Lavado de motor', 'Cera líquida protectora']
    },
    {
      id: 'p3', name: 'Completo', description: 'Lavado exterior e interior', price: 50000, durationMin: 120,
      couponCode: 'COMPLETO50', redemptions: 320, featured: false, icon: 'auto_awesome',
      features: ['Todo lo del Premium', 'Encerado a mano', 'Detallado de interiores']
    },
  ];

  constructor(private dialog: MatDialog) {}

  setTab(tab: ManagementTab): void {
    this.activeTab = tab;
  }

  // --- USUARIOS ---

  get filteredUsers(): AdminUser[] {
    const term = this.usersSearch.trim().toLowerCase();

    return this.users
      .filter(u => (this.userFilter === 'disabled' ? u.status === 'disabled' : u.status === 'active'))
      .filter(u => this.userFilter !== 'registered' || u.invited)
      .filter(u => !term
        || u.name.toLowerCase().includes(term)
        || u.email.toLowerCase().includes(term)
        || u.userType.toLowerCase().includes(term));
  }

  get enabledCount(): number { return this.users.filter(u => u.status === 'active').length; }
  get registeredCount(): number { return this.users.filter(u => u.invited).length; }
  get disabledCount(): number { return this.users.filter(u => u.status === 'disabled').length; }

  openCreateUser(): void {
    const dialogRef = this.dialog.open(CreateUserModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: CreateUserResult | null) => {
      if (!result) return;

      this.users = [
        ...this.users,
        {
          id: 'u' + (this.users.length + 1),
          name: result.name,
          email: result.email,
          userType: result.role,
          dateAdded: new Date().toISOString().slice(0, 10),
          invited: result.invite,
          status: 'active'
        }
      ];
    });
  }

  deleteUser(user: AdminUser): void {
    this.confirmDelete(() => {
      this.users = this.users.filter(u => u.id !== user.id);
    });
  }

  // --- ROLES ---

  openCreateRole(): void {
    const dialogRef = this.dialog.open(CreateRoleModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: CreateRoleResult | null) => {
      if (!result) return;

      this.roles = [
        ...this.roles,
        {
          id: 'r' + (this.roles.length + 1),
          name: result.name,
          description: result.description,
          permissions: result.permissions,
          usersCount: 0
        }
      ];
    });
  }

  deleteRole(role: UserRole): void {
    this.confirmDelete(() => {
      this.roles = this.roles.filter(r => r.id !== role.id);
    });
  }

  // --- SERVICIOS ---

  openCreateService(): void {
    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog' });
    this.handleServiceModalResult(dialogRef, null);
  }

  openEditService(service: CatalogService): void {
    const data: ServiceModalData = {
      name: service.name,
      price: service.price,
      description: '',
      durationMin: service.durationMin,
      category: service.category
    };

    const dialogRef = this.dialog.open(ServiceModal, { panelClass: 'custom-dialog', data });
    this.handleServiceModalResult(dialogRef, service);
  }

  private handleServiceModalResult(dialogRef: any, editing: CatalogService | null): void {
    dialogRef.afterClosed().subscribe((result: ServiceModalResult | null) => {
      if (!result) return;

      if (editing) {
        editing.name = result.name;
        editing.price = result.price;
        editing.durationMin = result.durationMin;
        editing.category = result.category;
        return;
      }

      this.services = [
        ...this.services,
        {
          id: 's' + (this.services.length + 1),
          name: result.name,
          price: result.price,
          durationMin: result.durationMin,
          category: result.category,
          status: 'active'
        }
      ];
    });
  }

  deleteService(service: CatalogService): void {
    this.confirmDelete(() => {
      this.services = this.services.filter(s => s.id !== service.id);
    });
  }

  // --- PROMOCIONES ---

  get totalRedemptions(): number {
    return this.promotions.reduce((sum, p) => sum + p.redemptions, 0);
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // --- confirmación compartida para borrar cualquier registro de las tablas ---
  private confirmDelete(onConfirm: () => void): void {
    const data: ConfirmModalData = {
      titulo: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.TITLE',
      mensaje: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.MESSAGE',
      textoConfirmar: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CONFIRM',
      textoCancelar: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CANCEL',
      peligro: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) onConfirm();
    });
  }
}
