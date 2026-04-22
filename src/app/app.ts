import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App {

  constructor(private translate: TranslateService) {
    this.initApp();
  }

  initApp() {
    //idioma guardado, español va por defecto
    const lang = localStorage.getItem('lang') || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(lang);

    //tema guardado
    const theme = localStorage.getItem('theme') || 'light';
    document.body.className = theme;
  }
}