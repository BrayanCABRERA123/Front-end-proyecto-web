import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

// lista reutilizable con los requisitos de una contraseña segura
// se marca cada requisito en verde a medida que el usuario lo cumple
@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './password-requirements.html',
  styleUrl: './password-requirements.scss'
})
export class PasswordRequirementsComponent {

  // contraseña que se está escribiendo
  @Input() password: string = '';

  get hasMinLength(): boolean { return this.password.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.password); }
  get hasNumber(): boolean { return /[0-9]/.test(this.password); }
  get hasSpecialChar(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.password); }
}
