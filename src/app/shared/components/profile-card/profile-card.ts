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

interface PaisTelefono {
  code: string;
  indicativo: string;
  flagCode: string;
  regex: RegExp;
  digitos: number;
}

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss'
})
export class ProfileCardComponent implements OnInit, OnChanges {

  @Input() usuario = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    iniciales: '',
    miembroDesde: ''
  };

  editando: boolean = false;

  paises: PaisTelefono[] = [
    { code: 'CO', indicativo: '+57', flagCode: 'co', regex: /^3\d{9}$/,     digitos: 10 },
    { code: 'US', indicativo: '+1',  flagCode: 'us', regex: /^[2-9]\d{9}$/, digitos: 10 },
    { code: 'FR', indicativo: '+33', flagCode: 'fr', regex: /^[67]\d{8}$/,  digitos: 9  },
    { code: 'BR', indicativo: '+55', flagCode: 'br', regex: /^9\d{9,10}$/, digitos: 11 }
  ];

  form!: FormGroup;

  telefonoDropdownOpen: boolean = false;

  constructor(private fb: FormBuilder, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: [
        this.usuario.nombre,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
        ]
      ],
      email: [
        this.usuario.email,
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ]
      ],
      telefonoPais: [this.paises[0].code, Validators.required],
      telefonoNumero: [
        this.limpiarNumero(this.usuario.telefono),
        Validators.required
      ],
      direccion: [
        this.usuario.direccion,
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100)
        ]
      ]
    }, { validators: this.validadorTelefono() });

    this.form.disable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes['usuario'] && !changes['usuario'].firstChange) {
      this.form.patchValue({
        nombre: this.usuario.nombre,
        email: this.usuario.email,
        telefonoNumero: this.limpiarNumero(this.usuario.telefono),
        direccion: this.usuario.direccion
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.telefonoDropdownOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.telefonoDropdownOpen = false;
    }
  }

  toggleTelefonoDropdown(): void {
    if (!this.editando) return;
    this.telefonoDropdownOpen = !this.telefonoDropdownOpen;
  }

  seleccionarPais(code: string): void {
    this.form.get('telefonoPais')?.setValue(code);
    this.form.get('telefonoPais')?.markAsTouched();
    this.telefonoDropdownOpen = false;
  }

  private limpiarNumero(telefono: string): string {
    return telefono.replace(/\D/g, '').slice(-10);
  }

  private validadorTelefono(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const paisCode = group.get('telefonoPais')?.value;
      const numeroControl = group.get('telefonoNumero');
      const numero = numeroControl?.value ?? '';

      const pais = this.paises.find(p => p.code === paisCode);

      if (!pais || !numero) {
        return null;
      }

      const valido = pais.regex.test(numero);

      if (!valido) {
        numeroControl?.setErrors({ telefonoInvalido: true });
      } else {
        const erroresActuales = { ...numeroControl?.errors };
        delete erroresActuales['telefonoInvalido'];
        const quedanErrores = Object.keys(erroresActuales).length > 0;
        numeroControl?.setErrors(quedanErrores ? erroresActuales : null);
      }

      return null;
    };
  }

  get paisSeleccionado(): PaisTelefono {
    const code = this.form.get('telefonoPais')?.value;
    return this.paises.find(p => p.code === code) ?? this.paises[0];
  }

  toggleEditar(): void {
    if (!this.editando) {
      this.editando = true;
      this.form.enable();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Guardar cambios:', this.form.value);

    this.editando = false;
    this.form.disable();
    this.telefonoDropdownOpen = false;
  }
}