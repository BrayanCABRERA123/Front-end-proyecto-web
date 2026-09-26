import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// resultado que devuelve el modal al enviar la calificación
export interface RatingResult {
  rating: number;
  comment: string;
}

// datos opcionales que recibe el modal
// si trae una calificación, el modal abre en modo edición con esos valores
export interface RatingModalData {
  rating?: number;
  comment?: string;
}

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

  rating = 0;

  comment = '';

  // indica si se está editando una calificación que ya existía
  isEditMode = false;

  constructor(
    private dialogRef: MatDialogRef<RatingModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: RatingModalData | null
  ) {
    if (data?.rating) {
      this.isEditMode = true;
      this.rating = data.rating;
      this.comment = data.comment ?? '';
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  rate(value: number): void {
    this.rating = value;
  }

  // se necesita al menos una estrella para poder enviar
  get canSubmit(): boolean {
    return this.rating > 0;
  }

  // cierra el modal devolviendo la calificación para que la pantalla muestre el éxito
  submit(): void {
    if (!this.canSubmit) return;

    // TODO: integrar con el backend para guardar la calificación
    const result: RatingResult = {
      rating: this.rating,
      comment: this.comment.trim()
    };

    this.dialogRef.close(result);
  }

}
