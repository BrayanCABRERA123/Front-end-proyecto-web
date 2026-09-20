import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

// modal reutilizable para consultar Términos y Condiciones / Política de Datos
import { LegalDocumentModal, LegalDocumentType } from '../../../../shared/dialogs/legal-document-modal/legal-document-modal';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  // año actual para el copyright
  currentYear = new Date().getFullYear();

  constructor(private dialog: MatDialog) {}

  // el visitante puede leer los documentos legales sin necesidad de registrarse
  viewLegalDocument(type: LegalDocumentType, event: Event): void {
    event.preventDefault();

    this.dialog.open(LegalDocumentModal, {
      panelClass: 'custom-dialog',
      data: { type, mode: 'view' }
    });
  }
}
