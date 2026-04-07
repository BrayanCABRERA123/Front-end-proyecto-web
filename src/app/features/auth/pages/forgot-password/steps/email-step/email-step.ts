import { Component, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-email-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
}