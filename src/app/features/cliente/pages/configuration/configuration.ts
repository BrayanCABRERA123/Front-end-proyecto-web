import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarComponent } from "../../../../layout/sidebar/sidebar";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    MatIconModule,
    FormsModule,
    MatSlideToggleModule,
    TranslateModule
  ],
  templateUrl: './configuration.html',
  styleUrls: ['./configuration.scss']
})

export class ConfigurationComponent implements OnInit {

  // CONFIGURACIONES
  settings = {
    push: true,
    email: true,
    promo: false,
    location: true
  };

  // ESTADOS
  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en', 'fr', 'pt']);
    this.translate.setDefaultLang('es');
  }

  // INICIO
  ngOnInit(): void {

    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('lang');

    // TEMA
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      this.applyTheme(this.selectedTheme);
    }

    // IDIOMA
    if (savedLang) {
      this.selectedLanguage = savedLang;
      this.translate.use(savedLang);
    } else {
      this.translate.use('es');
    }
  }

  // CAMBIAR TEMA
  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  // APLICAR TEMA
  applyTheme(theme: string): void {
    const themes = ['green-light', 'green-dark', 'pink', 'pink-dark'];
    document.body.classList.remove(...themes);

    if (themes.includes(theme)) {
      document.body.classList.add(theme);
    }
  }

  // CAMBIAR IDIOMA
  changeLanguage(lang: string): void {
    this.selectedLanguage = lang;

    this.translate.use(lang);

    localStorage.setItem('lang', lang);
  }

  // GUARDAR
  saveSettings(): void {
    console.log('Configuración guardada', {
      settings: this.settings,
      theme: this.selectedTheme,
      language: this.selectedLanguage
    });
  }
}