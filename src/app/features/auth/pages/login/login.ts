import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';
import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { LoginViewModel } from '../../viewmodels/login.viewmodel';

// vista del inicio de sesión: el formulario y el envío están en LoginViewModel
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    BackButtonComponent,
    AuthSidePanelComponent
  ],
  providers: [LoginViewModel],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {

  readonly vm = inject(LoginViewModel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // llegó aquí porque su sesión venció (lo marca el interceptor)
  readonly sessionExpired = this.route.snapshot.queryParamMap.has('expired');

  onSubmit() {
    this.vm.submit(user => {
      const target = this.vm.homeTarget(user, this.route.snapshot.queryParamMap.get('returnUrl'));
      // el modal se abre al llegar a la nueva página: Material cierra los diálogos al navegar
      this.router.navigateByUrl(target).then(() => this.vm.welcome(user));
    });
  }
}
