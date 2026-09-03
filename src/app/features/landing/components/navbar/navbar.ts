import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {

  constructor(
    private translate: TranslateService,
    private elementRef: ElementRef
  ) {
    const savedLang = localStorage.getItem('lang') || 'es';
    this.translate.use(savedLang);
    this.currentLanguage = savedLang;
  }

  languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' }
  ];

  currentLanguage = 'es';
  isLanguageMenuOpen = false;

  toggleLanguageMenu(event: Event) {
    event.stopPropagation();
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
  }

  closeLanguageMenu() {
    this.isLanguageMenuOpen = false;
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLanguage = lang;
    localStorage.setItem('lang', lang);
  }

  // cierra el menú si se hace click fuera del componente
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isLanguageMenuOpen = false;
    }
  }

  getFlagCode(code: string): string {
    switch (code) {
      case 'en': return 'gb';
      default: return code;
    }
  }
}
