import { Injectable, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, switchMap } from 'rxjs';

// perfil real contra el security-service
import { AuthService } from '../../core/services/auth';
import { AuthUser } from '../../core/models/auth.models';
// usuario de la sesión: el mismo que muestra el sidebar
import { UserSession } from '../../core/services/user-session';
import { apiErrorKey, applyFieldErrors } from '../../core/utils/api-error';
import { allowedEmailValidator } from '../../core/utils/email';

export interface PhoneCountry {
  code: string;
  dialCode: string;
  flagCode: string;
  regex: RegExp;
  digits: number;
}

// acción que corre el modal de contraseña con lo que escribió el usuario
export type PasswordAction = (password: string) => Observable<unknown>;

/**
 * Perfil de cliente, operario y admin (security-service): nombre, correo, teléfono y dirección.
 * Al guardar se actualiza la sesión, y con ella el sidebar.
 */
@Injectable()
export class ProfileViewModel {

  private readonly auth = inject(AuthService);
  private readonly session = inject(UserSession);

  readonly countries: PhoneCountry[] = [
    { code: 'CO', dialCode: '+57', flagCode: 'co', regex: /^3\d{9}$/,     digits: 10 },
    { code: 'US', dialCode: '+1',  flagCode: 'us', regex: /^[2-9]\d{9}$/, digits: 10 },
    { code: 'FR', dialCode: '+33', flagCode: 'fr', regex: /^[67]\d{8}$/,  digits: 9  },
    { code: 'BR', dialCode: '+55', flagCode: 'br', regex: /^9\d{9,10}$/, digits: 11 }
  ];

  // mientras llega lo del backend se muestra lo que trae la sesión
  private readonly initial = this.session.user();
  private readonly nameValidators = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(60),
    Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
  ];

  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: [this.splitName(this.initial.name).first, this.nameValidators],
    lastName: [this.splitName(this.initial.name).last, this.nameValidators],
    // el correo es el usuario de login: se puede cambiar, pero pidiendo la contraseña actual
    // A-01: un correo nuevo debe ser de un dominio permitido; el que ya tenía la cuenta se respeta
    email: [this.initial.email, [Validators.required, Validators.maxLength(60),
      allowedEmailValidator(() => this.currentEmail || this.initial.email)]],
    phoneCountry: [this.parsePhone(this.initial.phone).country, Validators.required],
    phoneNumber: [this.parsePhone(this.initial.phone).number, Validators.required],
    // opcional: el servicio es en la sede, la dirección queda solo como dato de contacto
    // (minLength no marca error si el campo está vacío)
    address: [this.initial.address, [Validators.minLength(5), Validators.maxLength(100)]]
  }, { validators: this.phoneValidator() });

  readonly editing = signal(false);
  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  readonly saving = signal(false);
  readonly errorKey = signal<string | null>(null);

  // nombre que se muestra arriba: el del backend cuando ya cargó, si no el de la sesión
  private readonly backendName = signal<string | null>(null);
  readonly displayName = computed(() => this.backendName() ?? this.session.user().name);

  // iniciales a partir del nombre mostrado (ej. "Ana María Pérez" -> "AM")
  readonly displayInitials = computed(() => {
    const initials = this.displayName().trim().split(/\s+/).slice(0, 2)
      .map(word => word.charAt(0).toUpperCase()).join('');
    return initials || this.session.initials();
  });

  // el administrador no puede cerrar su propia cuenta (security-service también lo rechaza)
  readonly canCloseAccount = computed(() => !(this.auth.user()?.roles ?? []).includes('ADMIN'));

  // rol que se muestra debajo del nombre (si tiene varios, el de más privilegios)
  readonly roleLabelKey = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('ADMIN')) return 'PROFILE.ROLE.ADMIN';
    if (roles.includes('OPERATOR')) return 'PROFILE.ROLE.OPERATOR';
    return 'PROFILE.ROLE.CLIENT';
  });

  // correo de login actual según el backend: si el usuario lo cambia, se pide la contraseña
  private currentEmail = '';

  // "eliminar cuenta": el backend la desactiva (no la borra); sus reservas y pagos se conservan
  readonly deactivateAccount: PasswordAction = password => this.auth.deactivateAccount(password);

  constructor() {
    this.form.disable();
  }

  get selectedCountry(): PhoneCountry {
    const code = this.form.controls.phoneCountry.value;
    return this.countries.find(c => c.code === code) ?? this.countries[0];
  }

  load(): void {
    // los datos reales salen del backend: así lo que se ve es lo que está guardado
    this.auth.getProfile().subscribe({
      next: user => this.applyBackendUser(user),
      error: () => undefined // sin backend se queda con lo de la sesión
    });

    // la dirección también vive en el backend (ADR-010): la misma en la web y en el celular
    this.auth.getAddress().subscribe({
      next: address => this.form.patchValue({ address }),
      error: () => undefined
    });
  }

  startEditing(): void {
    this.editing.set(true);
    this.errorKey.set(null);
    this.form.enable();
  }

  selectCountry(code: string): void {
    this.form.controls.phoneCountry.setValue(code);
    this.form.controls.phoneCountry.markAsTouched();
  }

  /**
   * Guarda los cambios. Si cambió el correo, `confirmPassword` abre el modal que pide la contraseña
   * y corre la acción que se le pasa (emite true si salió bien). `saved` se llama cuando quedó guardado.
   */
  save(confirmPassword: (action: PasswordAction) => Observable<boolean>, saved: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) return;

    const value = this.form.getRawValue();
    const newEmail = value.email.trim().toLowerCase();
    // A-01: igual que el validador, sin espacios ni mayúsculas (el mismo correo no pide contraseña)
    const emailChanged = !!this.currentEmail && newEmail !== this.currentEmail.trim().toLowerCase();
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();
    // sin espacio: el backend acepta "+573001234567"
    const phone = `${this.selectedCountry.dialCode}${value.phoneNumber}`;
    const address = (value.address ?? '').trim();
    const saveProfile = () => this.auth.updateProfile({ firstName, lastName, phone })
      .pipe(switchMap(() => this.auth.updateAddress(address)));

    // si cambió el correo, primero se confirma con la contraseña (el modal hace las dos cosas)
    if (emailChanged) {
      confirmPassword(password => this.auth.changeEmail(newEmail, password).pipe(switchMap(() => saveProfile())))
        .subscribe(done => {
          if (!done) return;
          this.afterSaved(value.phoneNumber, address);
          saved();
        });
      return;
    }

    this.saving.set(true);
    this.errorKey.set(null);
    saveProfile().subscribe({
      next: () => {
        this.saving.set(false);
        this.afterSaved(value.phoneNumber, address);
        saved();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
        // los campos que rechazó security-service se marcan en su sitio (WEB-05)
        applyFieldErrors(this.form, error, { phone: 'phoneNumber' });
      }
    });
  }

  // lo que pasa cuando el backend ya guardó: el formulario y la sesión (y con ella el sidebar)
  // quedan con lo guardado
  private afterSaved(phoneNumber: string, address: string): void {
    const user = this.auth.user();
    if (user) this.applyBackendUser(user);

    this.session.update({
      name: user ? `${user.firstName} ${user.lastName}` : this.displayName(),
      email: user?.email ?? this.currentEmail,
      phone: `${this.selectedCountry.dialCode} ${phoneNumber}`,
      address
    });

    this.editing.set(false);
    this.form.disable();
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
  }

  // respaldo para cuando solo llega el nombre completo: la primera palabra como nombre
  private splitName(fullName: string): { first: string; last: string } {
    const parts = (fullName ?? '').trim().split(/\s+/);
    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
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

      if (!country.regex.test(number)) {
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
}
