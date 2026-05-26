import { Component, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-email-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './email-step.html',
  styleUrl: './email-step.scss'
})
export class EmailStepComponent {

  email: string = '';

  @Output() emailSent = new EventEmitter<string>();

  onSubmit(): void {
    if (this.email.trim()) {
      this.emailSent.emit(this.email);
    }
  }

  get emailInvalido(): boolean {
    if(!this.email) return false;

    return !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email);
  }

  limpiarEspaciosCorreo() {

    if (!this.email) return;

    this.email = this.email.replace(/\s/g, '');

  }

  bloquearEspacios(event: KeyboardEvent){
      if ( event.key === ' '){
        event.preventDefault();
      }
  }
}