import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { AdminUsersService, StaffUser } from '../../../../core/services/admin-users';
import { OperatorsStore } from '../../services/operators-store';

type ManagementTab = 'users' | 'roles' | 'services' | 'promotions';

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
export class ManagementComponent implements OnInit {

  activeTab: ManagementTab = 'users';

  tabs: { key: ManagementTab; icon: string }[] = [
    { key: 'users', icon: 'group' },
    { key: 'roles', icon: 'verified_user' },
    { key: 'services', icon: 'build' },
    { key: 'promotions', icon: 'local_offer' },
  ];

  userFilter: 'enabled' | 'registered' | 'disabled' = 'enabled';
  usersSearch = '';

  // cuentas del personal (GET /admin/users): administradores y operarios
  users: StaffUser[] = [];

  // mensaje del mock API (no se puede borrar un operario con historial, etc.)
  usersError: string | null = null;

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

  constructor(
    private dialog: MatDialog,
    private adminUsers: AdminUsersService,
    private operatorsStore: OperatorsStore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.adminUsers.list$().subscribe(users => {
      this.users = users;
      this.cdr.markForCheck();
    });
  }

  setTab(tab: ManagementTab): void {
    this.activeTab = tab;
  }

  // --- USUARIOS ---

  get filteredUsers(): StaffUser[] {
    const term = this.usersSearch.trim().toLowerCase();

    return this.users
      // 'registered' = todas las cuentas del personal, sin importar el estado
      .filter(u => this.userFilter === 'registered'
        || (this.userFilter === 'disabled' ? u.status === 'disabled' : u.status === 'active'))
      .filter(u => !term
        || u.name.toLowerCase().includes(term)
        || u.email.toLowerCase().includes(term)
        || u.roleName.toLowerCase().includes(term));
  }

  get enabledCount(): number { return this.users.filter(u => u.status === 'active').length; }
  get registeredCount(): number { return this.users.length; }
  get disabledCount(): number { return this.users.filter(u => u.status === 'disabled').length; }

  // el modal crea la cuenta en el mock API y devuelve el usuario ya creado
  openCreateUser(): void {
    const dialogRef = this.dialog.open(CreateUserModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: CreateUserResult | null) => {
      if (!result) return;

      this.usersError = null;
      this.users = [result, ...this.users];
      if (result.role === 'OPERATOR') this.operatorsStore.invalidate();
      this.cdr.markForCheck();
    });
  }

  // habilita / inhabilita el acceso (una cuenta inhabilitada no puede iniciar sesión)
  toggleUserStatus(user: StaffUser): void {
    this.adminUsers.setActive$(user.id, user.status !== 'active').subscribe({
      next: updated => {
        this.usersError = null;
        this.users = this.users.map(u => (u.id === updated.id ? updated : u));
        if (updated.role === 'OPERATOR') this.operatorsStore.invalidate();
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => this.showUsersError(err)
    });
  }

  viewOperator(user: StaffUser): void {
    if (user.operatorId) this.router.navigate(['/admin/operators', user.operatorId]);
  }

  deleteUser(user: StaffUser): void {
    this.confirmDelete(() => {
      this.adminUsers.remove$(user.id).subscribe({
        next: () => {
          this.usersError = null;
          this.users = this.users.filter(u => u.id !== user.id);
          if (user.role === 'OPERATOR') this.operatorsStore.invalidate();
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => this.showUsersError(err)
      });
    });
  }

  private showUsersError(err: HttpErrorResponse): void {
    this.usersError = err.error?.message ?? 'Error';
    this.cdr.markForCheck();
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
      title: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.TITLE',
      message: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.MESSAGE',
      confirmText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CONFIRM',
      cancelText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CANCEL',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) onConfirm();
    });
  }
}
