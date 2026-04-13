import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarComponent } from "../../../../layout/sidebar/sidebar";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    MatIconModule,
    FormsModule,
    MatSlideToggleModule
  ],
  templateUrl: './configuration.html',
  styleUrls: ['./configuration.scss']
})

export class ConfigurationComponent implements OnInit {

  //  CONFIGURACIONES 
  settings = {
    push: true,
    email: true,
    promo: false,
    location: true
  };

  //  ESTADOS 
  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  //  INICIO 
  ngOnInit(): void {

    // Obtener datos guardados
    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('lang');

    // Aplicar tema guardado o default
    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    } else {
      this.applyTheme(this.selectedTheme);
    }

    // Aplicar idioma guardado
    if (savedLang) {
      this.selectedLanguage = savedLang;
    }
  }

  //  CAMBIAR TEMA 
  changeTheme(theme: string): void {
    this.selectedTheme = theme;

    localStorage.setItem('theme', theme);

    this.applyTheme(theme);
  }

  //  APLICAR TEMA 
  applyTheme(theme: string): void {

    const themes = ['green-light', 'green-dark', 'pink', 'pink-dark'];

    document.body.classList.remove(...themes);

    // Aplicar nueva clase
    if (themes.includes(theme)) {
      document.body.classList.add(theme);
    }
  }

  //  CAMBIAR IDIOMA 
  changeLanguage(lang: string): void {
    this.selectedLanguage = lang;

    // Guardar idioma
    localStorage.setItem('lang', lang);

  }

  //  GUARDAR 
  saveSettings(): void {
    console.log('Configuración guardada', {
      settings: this.settings,
      theme: this.selectedTheme,
      language: this.selectedLanguage
    });
  }
}