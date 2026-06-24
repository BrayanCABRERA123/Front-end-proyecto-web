import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './rating-modal.html',
  styleUrl: './rating-modal.scss'
})
export class RatingModalComponent {


  constructor(
    private dialogRef: MatDialogRef<RatingModalComponent>
  ) { }

  cerrarModal(): void {
    this.dialogRef.close();
  } 

  rating = 0;

  comentario = '';

  calificar(valor: number): void {
    this.rating = valor;
  }

  enviar(): void {

    console.log({
      rating: this.rating,
      comentario: this.comentario
    });

    this.cerrarModal();
  }

}