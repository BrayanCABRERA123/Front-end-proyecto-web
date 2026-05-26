import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslateModule
  ],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss'
})
export class SettingsPanelComponent implements OnInit {

  settings = {
    push: true,
    email: true,
    promo: false,
    location: true
  };

  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en', 'fr', 'pt']);
    this.translate.setDefaultLang('es');
  }

  ngOnInit(): void {

    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('lang');

    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }

    if (savedLang) {
      this.selectedLanguage = savedLang;
      this.translate.use(savedLang);
    }
  }

  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  applyTheme(theme: string): void {

    const themes = [
      'green-light',
      'green-dark',
      'pink',
      'pink-dark'
    ];

    document.body.classList.remove(...themes);

    document.body.classList.add(theme);
  }

  changeLanguage(lang: string): void {

    this.selectedLanguage = lang;

    this.translate.use(lang);

    localStorage.setItem('lang', lang);
  }

}