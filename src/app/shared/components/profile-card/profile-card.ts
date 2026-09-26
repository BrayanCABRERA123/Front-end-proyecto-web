import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar el mensaje de perfil actualizado
import { StatusModal, StatusModalData } from '../../dialogs/status-modal/status-modal';
// modal con el formulario para cambiar la contraseña
import { ChangePasswordModal } from '../../dialogs/change-password-modal/change-password-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../dialogs/confirm-modal/confirm-modal';
import { Router } from '@angular/router';

// datos que emite el perfil al guardar (la página de cada rol decide dónde guardarlos)
export interface ProfileSaveData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PhoneCountry {
  code: string;
  dialCode: string;
  flagCode: string;
  regex: RegExp;
  digits: number;
}

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss'
})
export class ProfileCardComponent implements OnInit, OnChanges {

  @Input() user = {
    name: '',
    email: '',
    phone: '',
    address: '',
    initials: '',
    memberSince: ''
  };

  // avisa a la página con los datos nuevos cuando el usuario guarda
  @Output() saved = new EventEmitter<ProfileSaveData>();

  editing: boolean = false;

  countries: PhoneCountry[] = [
    { code: 'CO', dialCode: '+57', flagCode: 'co', regex: /^3\d{9}$/,     digits: 10 },
    { code: 'US', dialCode: '+1',  flagCode: 'us', regex: /^[2-9]\d{9}$/, digits: 10 },
    { code: 'FR', dialCode: '+33', flagCode: 'fr', regex: /^[67]\d{8}$/,  digits: 9  },
    { code: 'BR', dialCode: '+55', flagCode: 'br', regex: /^9\d{9,10}$/, digits: 11 }
  ];

  form!: FormGroup;

  phoneDropdownOpen: boolean = false;

  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.user.name,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
        ]
      ],
      email: [
        this.user.email,
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ]
      ],
      phoneCountry: [this.parsePhone(this.user.phone).country, Validators.required],
      phoneNumber: [
        this.parsePhone(this.user.phone).number,
        Validators.required
      ],
      // opcional: el servicio es en la sede, la dirección queda solo como dato de contacto
      // (minLength no marca error si el campo está vacío)
      address: [
        this.user.address,
        [
          Validators.minLength(5),
          Validators.maxLength(100)
        ]
      ]
    }, { validators: this.phoneValidator() });

    this.form.disable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes['user'] && !changes['user'].firstChange) {
      this.form.patchValue({
        name: this.user.name,
        email: this.user.email,
        phoneCountry: this.parsePhone(this.user.phone).country,
        phoneNumber: this.parsePhone(this.user.phone).number,
        address: this.user.address
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.phoneDropdownOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.phoneDropdownOpen = false;
    }
  }

  togglePhoneDropdown(): void {
    if (!this.editing) return;
    this.phoneDropdownOpen = !this.phoneDropdownOpen;
  }

  selectCountry(code: string): void {
    this.form.get('phoneCountry')?.setValue(code);
    this.form.get('phoneCountry')?.markAsTouched();
    this.phoneDropdownOpen = false;
  }

  // separa el indicativo del país y el número (ej. "+57 3001234567" -> CO + "3001234567")
  private parsePhone(phone: string): { country: string; number: string } {
    const value = (phone ?? '').trim();

    // se revisan primero los indicativos más largos para no confundir +1 con +12...
    const country = [...this.countries]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find(c => value.startsWith(c.dialCode));

    if (!country) {
      return { country: this.countries[0].code, number: value.replace(/\D/g, '') };
    }

    return {
      country: country.code,
      number: value.slice(country.dialCode.length).replace(/\D/g, '')
    };
  }

  private phoneValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const countryCode = group.get('phoneCountry')?.value;
      const numberControl = group.get('phoneNumber');
      const number = numberControl?.value ?? '';

      const country = this.countries.find(c => c.code === countryCode);

      if (!country || !number) {
        return null;
      }

      const isValid = country.regex.test(number);

      if (!isValid) {
        numberControl?.setErrors({ invalidPhone: true });
      } else {
        const currentErrors = { ...numberControl?.errors };
        delete currentErrors['invalidPhone'];
        const hasRemainingErrors = Object.keys(currentErrors).length > 0;
        numberControl?.setErrors(hasRemainingErrors ? currentErrors : null);
      }

      return null;
    };
  }

  get selectedCountry(): PhoneCountry {
    const code = this.form.get('phoneCountry')?.value;
    return this.countries.find(c => c.code === code) ?? this.countries[0];
  }

  toggleEdit(): void {
    if (!this.editing) {
      this.editing = true;
      this.form.enable();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    // se emiten los datos para que la página los guarde (y el sidebar se actualice)
    this.saved.emit({
      name: value.name.trim(),
      email: value.email.trim(),
      phone: `${this.selectedCountry.dialCode} ${value.phoneNumber}`,
      address: (value.address ?? '').trim()
    });

    this.editing = false;
    this.form.disable();
    this.phoneDropdownOpen = false;

    this.showProfileSaved();
  }

  // muestra el modal de perfil actualizado (sirve para cliente, operador y admin)
  private showProfileSaved(): void {
    this.showSuccess({
      title: 'PROFILE.SUCCESS_TITLE',
      message: 'PROFILE.SUCCESS_MESSAGE'
    });
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

  // pide confirmación antes de eliminar la cuenta (acción irreversible)
  confirmDeleteAccount(): void {
    const data: ConfirmModalData = {
      title: 'PROFILE.DELETE_CONFIRM_TITLE',
      message: 'PROFILE.DELETE_CONFIRM_MESSAGE',
      confirmText: 'PROFILE.DELETE_CONFIRM_BUTTON',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.deleteAccount();
    });
  }

  // elimina la cuenta, cierra la sesión y, al cerrar el aviso, vuelve al inicio
  private deleteAccount(): void {
    // TODO: integrar con el backend para eliminar la cuenta
    // se limpia la sesión igual que en el cierre de sesión del sidebar
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // la sesión ya se cerró, así que el usuario siempre debe salir por el botón
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

  // abre el modal de estado de éxito con los textos indicados
  private showSuccess(data: StatusModalData): void {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
