import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AdminUsersService, StaffRole, StaffUser } from '../../../core/services/admin-users';
import { UserRole } from '../../../core/services/auth';

// El modal devuelve la cuenta ya creada en el mock API (o null si se cancela).
export type CreateUserResult = StaffUser;

// Mismas reglas que el registro público y que valida el mock API.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
const PHONE_PATTERN = /^3[0-9]{9}$/;

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.scss'
})
export class CreateUserModal implements OnInit {

  // roles del personal que puede crear el admin (GET /admin/roles)
  roleOptions: StaffRole[] = [];

  name = '';
  email = '';
  phone = '';
  password = '';
  role: UserRole = 'OPERATOR';
  specialty = '';

  saving = false;
  errorMessage: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CreateUserModal>,
    private adminUsers: AdminUsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.adminUsers.roles$().subscribe(roles => {
      this.roleOptions = roles;
      this.cdr.markForCheck();
    });
  }

  get emailInvalid(): boolean {
    return !!this.email && !EMAIL_PATTERN.test(this.email.trim());
  }

  get passwordInvalid(): boolean {
    return !!this.password && !PASSWORD_PATTERN.test(this.password);
  }

  get phoneInvalid(): boolean {
    return !!this.phone && !PHONE_PATTERN.test(this.phone.trim());
  }

  get canCreate(): boolean {
    return (
      this.name.trim().length >= 3 &&
      EMAIL_PATTERN.test(this.email.trim()) &&
      PASSWORD_PATTERN.test(this.password) &&
      !this.phoneInvalid &&
      !this.saving
    );
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    if (!this.canCreate) return;

    this.saving = true;
    this.errorMessage = null;

    this.adminUsers
      .create$({
        nombre: this.name.trim(),
        correo: this.email.trim(),
        telefono: this.phone.trim() || undefined,
        contrasena: this.password,
        rol: this.role,
        specialty: this.role === 'OPERATOR' ? this.specialty.trim() || undefined : undefined
      })
      .subscribe({
        next: created => this.dialogRef.close(created),
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.errorMessage = err.error?.message ?? 'Error';
          this.cdr.markForCheck();
        }
      });
  }
}
