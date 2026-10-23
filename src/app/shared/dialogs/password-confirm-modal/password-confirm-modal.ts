import { Component, Inject, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { apiErrorKey } from '../../../core/utils/api-error';

// datos que recibe el modal: los textos y la acción que se ejecuta con la contraseña
export interface PasswordConfirmModalData {
  icon: string;
  title: string;
  message: string;
  confirmText: string;
  // true para acciones peligrosas (ej. eliminar la cuenta): botón en rojo
  danger?: boolean;
  // lo que se hace con la contraseña; si el servidor la rechaza, el error se muestra en el modal
  action: (password: string) => Observable<unknown>;
}

// modal que pide la contraseña actual para confirmar una acción sensible
// (cambiar el correo de login, eliminar la cuenta). Cierra con true solo si la acción salió bien.
@Component({
  selector: 'app-password-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatIconModule],
  templateUrl: './password-confirm-modal.html',
  // mismo diseño que el modal de cambiar contraseña
  styleUrl: '../change-password-modal/change-password-modal.scss'
})
export class PasswordConfirmModal {

  password = '';
  showPassword = false;
  submitted = false;

  saving = signal(false);
  errorKey = signal<string | null>(null);

  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private dialogRef: MatDialogRef<PasswordConfirmModal>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordConfirmModalData
  ) {}

  get passwordMissing(): boolean {
    return this.submitted && !this.password;
  }

  confirm(): void {
    this.submitted = true;
    if (!this.password || this.saving()) return;

    this.saving.set(true);
    this.errorKey.set(null);

    this.data.action(this.password).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
