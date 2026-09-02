import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface ConfirmModalData {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss'
})
export class ConfirmModal {

  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar: string;
  peligro: boolean;

  constructor(
    private dialogRef: MatDialogRef<ConfirmModal>,
    @Inject(MAT_DIALOG_DATA) private data: ConfirmModalData
  ) {
    this.titulo = data.titulo;
    this.mensaje = data.mensaje;
    this.textoConfirmar = data.textoConfirmar ?? 'COMMON.DELETE';
    this.textoCancelar = data.textoCancelar ?? 'COMMON.CANCEL';
    this.peligro = data.peligro ?? true;
  }

  cerrar(confirmado: boolean) {
    this.dialogRef.close(confirmado);
  }
}