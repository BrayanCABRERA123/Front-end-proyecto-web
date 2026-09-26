import { Component, Input, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
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
    private dialog: MatDialog
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
      phoneCountry: [this.countries[0].code, Validators.required],
      phoneNumber: [
        this.cleanNumber(this.user.phone),
        Validators.required
      ],
      address: [
        this.user.address,
        [
          Validators.required,
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
        phoneNumber: this.cleanNumber(this.user.phone),
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

  private cleanNumber(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
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

    console.log('Guardar cambios:', this.form.value);

    this.editing = false;
    this.form.disable();
    this.phoneDropdownOpen = false;

    this.showProfileSaved();
  }

  // muestra el modal de perfil actualizado (sirve para cliente, operador y admin)
  private showProfileSaved(): void {
    const data: StatusModalData = {
      title: 'PROFILE.SUCCESS_TITLE',
      message: 'PROFILE.SUCCESS_MESSAGE'
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
