import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth';
import { PreferencesService } from './core/services/preferences';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App {

  constructor(
    private translate: TranslateService,
    private auth: AuthService,
    private preferences: PreferencesService
  ) {
    this.initApp();
  }

  initApp() {
    this.translate.setDefaultLang('es');
    // primero lo último usado en este navegador; con sesión, lo de la cuenta (RF-019/020)
    this.preferences.applyLocal();
    if (this.auth.isAuthenticated()) {
      this.preferences.loadForUser();
    }
  }
}