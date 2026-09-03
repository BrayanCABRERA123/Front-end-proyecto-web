import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent {

  // tarjetas de información de contacto
  contactCards = [
    { icon: 'mail', labelKey: 'CONTACT.EMAIL_LABEL', value: 'hola@aquawash.com' },
    { icon: 'call', labelKey: 'CONTACT.PHONE_LABEL', value: '+57 300 123 4567' },
    { icon: 'public', labelKey: 'CONTACT.COVERAGE_LABEL', valueKey: 'CONTACT.COVERAGE_VALUE' }
  ];
}
