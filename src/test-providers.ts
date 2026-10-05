// Providers comunes para las pruebas unitarias (angular.json -> test.options.providersFile).
// Los componentes usan traducciones, HTTP, router y diálogos; sin esto cada spec tendría
// que declararlos por separado.
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';

export default [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  provideNoopAnimations(),
  provideTranslateService({ fallbackLang: 'es' }),
  { provide: MAT_DIALOG_DATA, useValue: {} },
  { provide: MatDialogRef, useValue: { close: () => undefined } },
];
