import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent {

  constructor(
    private translate: TranslateService,
    private eRef: ElementRef
  ) {
    const langGuardado = localStorage.getItem('lang') || 'es';
    this.translate.use(langGuardado);
    this.idiomaActual = langGuardado;
  }

  idiomas = [
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'en', label: 'English', flag: 'gb' }, 
  { code: 'pt', label: 'Português', flag: 'pt' },
  { code: 'fr', label: 'Français', flag: 'fr' }
];

  idiomaActual = 'es';

  cambiarIdioma(lang: string) {
    this.translate.use(lang);
    this.idiomaActual = lang;
    localStorage.setItem('lang', lang);
  }

  isLangOpen = false;

  toggleLangMenu(event: Event) {
    event.stopPropagation();
    this.isLangOpen = !this.isLangOpen;
  }

  cerrarMenuIdioma() {
    this.isLangOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isLangOpen = false;
    }
  }

  getFlag(code: string): string {
  switch (code) {
    case 'en': return 'gb'; 
    default: return code;
  }
}

  features = [
    {
      icono: 'water_drop',
      titulo: 'FEATURES.ITEMS.ECO.TITLE',
      descripcion: 'FEATURES.ITEMS.ECO.DESC'
    },
    {
      icono: 'shield',
      titulo: 'FEATURES.ITEMS.PROTECTION.TITLE',
      descripcion: 'FEATURES.ITEMS.PROTECTION.DESC'
    },
    {
      icono: 'star',
      titulo: 'FEATURES.ITEMS.RATING.TITLE',
      descripcion: 'FEATURES.ITEMS.RATING.DESC'
    }
  ];
}