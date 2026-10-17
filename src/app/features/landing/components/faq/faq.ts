import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// preguntas frecuentes de la página de inicio (las respuestas siguen el manual de usuario)
const QUESTIONS = ['BOOK', 'PAYMENT', 'CANCEL', 'OPERATOR', 'POINTS', 'REMINDERS', 'APP'] as const;

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss'
})
export class FaqComponent {

  readonly questions = QUESTIONS;

  // una sola pregunta abierta a la vez; empieza abierta la primera
  readonly open = signal<string | null>(QUESTIONS[0]);

  toggle(key: string): void {
    this.open.update(current => (current === key ? null : key));
  }
}
