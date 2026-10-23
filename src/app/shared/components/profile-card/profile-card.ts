import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
// modal reutilizable para mostrar el mensaje de perfil actualizado
import { StatusModal, StatusModalData } from '../../dialogs/status-modal/status-modal';
// modal con el formulario para cambiar la contraseña
import { ChangePasswordModal } from '../../dialogs/change-password-modal/change-password-modal';
// modal que pide la contraseña para confirmar acciones sensibles (cambiar correo, eliminar cuenta)
import { PasswordConfirmModal, PasswordConfirmModalData } from '../../dialogs/password-confirm-modal/password-confirm-modal';
import { ProfileViewModel } from '../../viewmodels/profile.viewmodel';

// tarjeta de perfil de los 3 roles: los datos y el guardado están en ProfileViewModel
@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ReactiveFormsModule],
  providers: [ProfileViewModel],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss'
})
export class ProfileCardComponent implements OnInit {

  readonly vm = inject(ProfileViewModel);
  private readonly elRef = inject(ElementRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  phoneDropdownOpen = false;

  ngOnInit(): void {
    this.vm.load();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.phoneDropdownOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.phoneDropdownOpen = false;
    }
  }

  togglePhoneDropdown(): void {
    if (!this.vm.editing()) return;
    this.phoneDropdownOpen = !this.phoneDropdownOpen;
  }

  selectCountry(code: string): void {
    this.vm.selectCountry(code);
    this.phoneDropdownOpen = false;
  }

  // el mismo botón entra a editar y guarda
  toggleEdit(): void {
    if (!this.vm.editing()) {
      this.vm.startEditing();
      return;
    }

    this.vm.save(
      action => this.confirmWithPassword({
        icon: 'alternate_email',
        title: 'PROFILE.CHANGE_EMAIL_TITLE',
        message: 'PROFILE.CHANGE_EMAIL_MESSAGE',
        confirmText: 'PROFILE.SAVE',
        action
      }),
      () => {
        this.phoneDropdownOpen = false;
        this.showSuccess({ title: 'PROFILE.SUCCESS_TITLE', message: 'PROFILE.SUCCESS_MESSAGE' });
      }
    );
  }

  // abre el modal para cambiar la contraseña y, si se guardó, muestra el éxito
  openChangePassword(): void {
    const dialogRef = this.dialog.open(ChangePasswordModal, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe((changed: boolean) => {
      if (!changed) return;

      this.showSuccess({
        title: 'PROFILE.PASSWORD_SUCCESS_TITLE',
        message: 'PROFILE.PASSWORD_SUCCESS_MESSAGE'
      });
    });
  }

  // "eliminar cuenta": pide la contraseña y el backend la desactiva (no la borra).
  // Ya no se puede iniciar sesión con ella; sus reservas y pagos se conservan.
  confirmDeleteAccount(): void {
    if (!this.vm.canCloseAccount()) return;
    this.confirmWithPassword({
      icon: 'delete',
      title: 'PROFILE.DELETE_CONFIRM_TITLE',
      message: 'PROFILE.DELETE_CONFIRM_MESSAGE',
      confirmText: 'PROFILE.DELETE_CONFIRM_BUTTON',
      danger: true,
      action: this.vm.deactivateAccount
    }).subscribe(done => {
      if (done) this.showAccountDeleted();
    });
  }

  // abre el modal que pide la contraseña y ejecuta la acción; emite true si salió bien
  private confirmWithPassword(data: PasswordConfirmModalData): Observable<boolean> {
    return this.dialog
      .open(PasswordConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .pipe(map((done: boolean | undefined) => !!done));
  }

  // la sesión ya se cerró, así que el usuario siempre sale por el botón del aviso
  private showAccountDeleted(): void {
    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      disableClose: true,
      data: {
        title: 'PROFILE.DELETE_SUCCESS_TITLE',
        message: 'PROFILE.DELETE_SUCCESS_MESSAGE'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigateByUrl('/');
    });
  }

  // abre el modal de estado de éxito con los textos indicados (sirve para cliente, operador y admin)
  private showSuccess(data: StatusModalData): void {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
