import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html'
})
export class App {
  constructor(private translate: TranslateService) {
    this.initApp();
  }

  initApp() {
    const lang = localStorage.getItem('lang') || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(lang);

    const theme = localStorage.getItem('theme') || 'light';
    document.body.className = theme;
  }
}
