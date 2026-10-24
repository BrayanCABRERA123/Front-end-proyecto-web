import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';
import { MatIconModule } from '@angular/material/icon';

// paso 1: el correo; el envío lo hace ForgotPasswordViewModel
@Component({
  selector: 'app-email-step',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, TranslateModule, RouterModule],
  templateUrl: './email-step.html',
  styleUrl: './email-step.scss'
})
export class EmailStepComponent {

  readonly vm = inject(ForgotPasswordViewModel);

  // no permite escribir espacios en el correo
  blockSpaces(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }
}
