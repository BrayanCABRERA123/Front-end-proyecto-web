import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// tipo de documento legal a mostrar
export type LegalDocumentType = 'terms' | 'privacy';

// modo del modal:
// 'view'   -> solo lectura, botón "Cerrar" (se usa en Configuración y en el Footer)
// 'accept' -> pide aceptación explícita, botones "Cancelar" / "Aceptar y continuar"
//             (se usa al abrir el documento desde el registro)
export type LegalDocumentMode = 'view' | 'accept';

export interface LegalDocumentModalData {
  type: LegalDocumentType;
  mode?: LegalDocumentMode;
}

interface LegalSection {
  HEADING: string;
  BODY: string;
}

@Component({
  selector: 'app-legal-document-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './legal-document-modal.html',
  styleUrl: './legal-document-modal.scss'
})
export class LegalDocumentModal implements OnInit, OnDestroy {

  type: LegalDocumentType;
  mode: LegalDocumentMode;

  title = '';
  sections: LegalSection[] = [];

  lastUpdatedLabel = '';
  lastUpdatedDate = '';

  private langSub?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<LegalDocumentModal>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: LegalDocumentModalData
  ) {
    this.type = data.type;
    this.mode = data.mode ?? 'view';
  }

  ngOnInit(): void {
    this.loadContent();

    // si el usuario cambia de idioma con el modal abierto, refrescamos el texto
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.loadContent();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private loadContent(): void {
    const root = this.type === 'terms' ? 'LEGAL.TERMS' : 'LEGAL.PRIVACY';

    this.title = this.translate.instant(`${root}.TITLE`);
    this.sections = this.translate.instant(`${root}.SECTIONS`) ?? [];

    this.lastUpdatedLabel = this.translate.instant('LEGAL.LAST_UPDATED_LABEL');
    this.lastUpdatedDate = this.translate.instant('LEGAL.LAST_UPDATED_DATE');
  }

  close(accepted: boolean = false): void {
    this.dialogRef.close(accepted);
  }
}
