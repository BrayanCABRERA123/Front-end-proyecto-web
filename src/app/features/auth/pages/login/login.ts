import { ChangeDetectorRef, Component } from '@angular/core';
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
import { Auth } from '../../../../core/services/auth';


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

  mostrarContrasena = false;

  // clave i18n del error a mostrar (credenciales inválidas o cuenta inhabilitada)
  loginError: string | null = null;

  cargando = false;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {

    this.loginForm = this.fb.group({

      correo: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@gmail\.com$/)
        ]
      ],

      contrasena: [
        '',
        Validators.required
      ]

    });

  }


  get f() {
    return this.loginForm.controls;
  }


  toggleContrasena() {
    this.mostrarContrasena =
      !this.mostrarContrasena;
  }


  correoSinEspacios() {

    const correo =
      this.loginForm.get('correo');

    if (!correo) return;

    correo.setValue(
      correo.value.replace(/\s/g, ''),
      { emitEvent: false }
    );

  }


  onSubmit() {

    if (this.loginForm.invalid) return;

    const correo =
      this.loginForm.value.correo;

    const contrasena =
      this.loginForm.value.contrasena;

    this.cargando = true;
    this.loginError = null;

    this.auth.login(correo, contrasena).subscribe({

      next: ({ user }) => {

        this.cargando = false;

        const redirect = this.route.snapshot.queryParamMap.get('redirect');

        this.router.navigateByUrl(redirect || this.auth.homeRouteFor(user.rol));

      },

      error: (err: Error) => {

        this.cargando = false;
        this.loginError =
          err.message === 'ACCOUNT_DISABLED' ? 'LOGIN.ACCOUNT_DISABLED'
          : err.message === 'SERVER_UNAVAILABLE' ? 'COMMON.SERVER_UNAVAILABLE'
          : 'LOGIN.INVALID_CREDENTIALS';
        this.cdr.detectChanges();

      }

    });

  }

}