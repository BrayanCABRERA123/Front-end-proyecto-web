import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef, ChangeDetectorRef, inject, signal } from '@angular/core';
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
// modal que pide la contraseña para confirmar acciones sensibles (cambiar correo, eliminar cuenta)
import { PasswordConfirmModal, PasswordConfirmModalData } from '../../dialogs/password-confirm-modal/password-confirm-modal';
import { Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

// perfil real contra el security-service
import { AuthService } from '../../../core/services/auth';
import { AuthUser } from '../../../core/models/auth.models';
import { apiErrorKey } from '../../../core/utils/api-error';

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

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  saving = signal(false);
  errorKey = signal<string | null>(null);

  // nombre que se muestra arriba: el del backend cuando ya cargó, si no el que llega por @Input
  private readonly backendName = signal<string | null>(null);

  // correo de login actual según el backend: si el usuario lo cambia, se pide la contraseña
  private currentEmail = '';

  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  get displayName(): string {
    return this.backendName() ?? this.user.name;
  }

  // rol que se muestra debajo del nombre (si tiene varios, el de más privilegios)
  get roleLabelKey(): string {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('ADMIN')) return 'PROFILE.ROLE.ADMIN';
    if (roles.includes('OPERATOR')) return 'PROFILE.ROLE.OPERATOR';
    return 'PROFILE.ROLE.CLIENT';
  }

  // iniciales a partir del nombre mostrado (ej. "Ana María Pérez" -> "AM")
  get displayInitials(): string {
    const initials = this.displayName.trim().split(/\s+/).slice(0, 2)
      .map(word => word.charAt(0).toUpperCase()).join('');
    return initials || this.user.initials;
  }

  ngOnInit(): void {
    const nameValidators = [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(60),
      Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
    ];

    this.form = this.fb.group({
      firstName: [this.splitName(this.user.name).first, nameValidators],
      lastName: [this.splitName(this.user.name).last, nameValidators],
      // el correo es el usuario de login: se puede cambiar, pero pidiendo la contraseña actual
      email: [
        this.user.email,
        [
          Validators.required,
          Validators.maxLength(60),
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

    // los datos reales salen del backend: así lo que se ve es lo que está guardado
    this.auth.getProfile().subscribe({
      next: user => this.applyBackendUser(user),
      error: () => undefined // sin backend se queda con lo que llegó por @Input
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // la dirección todavía no la guarda el backend (ADR-010: security.person_address pendiente)
    if (this.form && changes['user'] && !changes['user'].firstChange) {
      this.form.patchValue({ address: this.user.address });
    }
  }

  private applyBackendUser(user: AuthUser): void {
    this.backendName.set(`${user.firstName} ${user.lastName}`);
    this.currentEmail = user.email;
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneCountry: this.parsePhone(user.phone ?? '').country,
      phoneNumber: this.parsePhone(user.phone ?? '').number
    });
    this.cdr.markForCheck();
  }

  // respaldo para cuando solo llega el nombre completo: la primera palabra como nombre
  private splitName(fullName: string): { first: string; last: string } {
    const parts = (fullName ?? '').trim().split(/\s+/);
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
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
      this.errorKey.set(null);
      this.form.enable();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.saving()) return;

    const value = this.form.getRawValue();
    const newEmail = value.email.trim().toLowerCase();
    const emailChanged = !!this.currentEmail && newEmail !== this.currentEmail.toLowerCase();
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    // sin espacio: el backend acepta "+573001234567"
    const phone = `${this.selectedCountry.dialCode}${value.phoneNumber}`;

    const saveProfile = () => this.auth.updateProfile({ firstName, lastName, phone });

    // si cambió el correo, primero se confirma con la contraseña (el modal hace las dos cosas)
    if (emailChanged) {
      this.confirmWithPassword({
        icon: 'alternate_email',
        title: 'PROFILE.CHANGE_EMAIL_TITLE',
        message: 'PROFILE.CHANGE_EMAIL_MESSAGE',
        confirmText: 'PROFILE.SAVE',
        action: password => this.auth.changeEmail(newEmail, password).pipe(switchMap(() => saveProfile()))
      }).subscribe(done => {
        if (done) this.afterSaved(value);
      });
      return;
    }

    this.saving.set(true);
    this.errorKey.set(null);

    saveProfile().subscribe({
      next: () => {
        this.saving.set(false);
        this.afterSaved(value);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }

  // lo que pasa cuando el backend ya guardó: se refresca el formulario con lo guardado
  private afterSaved(value: { phoneNumber: string; address?: string }): void {
    const user = this.auth.user();
    if (user) this.applyBackendUser(user);

    // la página guarda lo que el backend todavía no maneja (la dirección) y refresca el sidebar
    this.saved.emit({
      name: user ? `${user.firstName} ${user.lastName}` : this.displayName,
      email: user?.email ?? this.currentEmail,
      phone: `${this.selectedCountry.dialCode} ${value.phoneNumber}`,
      address: (value.address ?? '').trim()
    });

    this.editing = false;
    this.form.disable();
    this.phoneDropdownOpen = false;
    this.cdr.markForCheck();

    this.showProfileSaved();
  }

  // abre el modal que pide la contraseña y ejecuta la acción; emite true si salió bien
  private confirmWithPassword(data: PasswordConfirmModalData): Observable<boolean> {
    return this.dialog
      .open(PasswordConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .pipe(map((done: boolean | undefined) => !!done));
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

  // "eliminar cuenta": pide la contraseña y el backend la desactiva (no la borra).
  // Ya no se puede iniciar sesión con ella; sus reservas y pagos se conservan.
  confirmDeleteAccount(): void {
    this.confirmWithPassword({
      icon: 'delete',
      title: 'PROFILE.DELETE_CONFIRM_TITLE',
      message: 'PROFILE.DELETE_CONFIRM_MESSAGE',
      confirmText: 'PROFILE.DELETE_CONFIRM_BUTTON',
      danger: true,
      action: password => this.auth.deactivateAccount(password)
    }).subscribe(done => {
      if (done) this.showAccountDeleted();
    });
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

  // abre el modal de estado de éxito con los textos indicados
  private showSuccess(data: StatusModalData): void {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
