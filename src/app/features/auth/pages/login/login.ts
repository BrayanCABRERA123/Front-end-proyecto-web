import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';
import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth';
import { AuthUser } from '../../../../core/models/auth.models';
import { apiErrorKey } from '../../../../core/utils/api-error';


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
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})

export class LoginComponent {

  loginForm: FormGroup;

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  loading = signal(false);

  errorKey = signal<string | null>(null);

  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // llegó aquí porque su sesión venció (lo marca el interceptor)
  readonly sessionExpired = this.route.snapshot.queryParamMap.has('expired');


  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@gmail\.com$/)
        ]
      ],

      password: [
        '',
        Validators.required
      ]

    });

  }


  get f() {
    return this.loginForm.controls;
  }


  stripEmailSpaces() {

    const email = this.loginForm.get('email');

    if (!email) return;

    email.setValue(
      email.value.replace(/\s/g, ''),
      { emitEvent: false }
    );

  }


  onSubmit() {

    if (this.loginForm.invalid || this.loading()) return;

    const { email, password } = this.loginForm.value;

    this.loading.set(true);
    this.errorKey.set(null);

    this.auth.login(email, password).subscribe({
      next: user => this.goHome(user),
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });

  }


  // vuelve a la página que pidió antes del login si es de su área;
  // si no, a la pantalla de inicio de su rol
  private goHome(user: AuthUser) {

    const home = this.auth.homeRoute(user);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const target = returnUrl?.startsWith(home) ? returnUrl : home;

    this.router.navigateByUrl(target);

  }

}
