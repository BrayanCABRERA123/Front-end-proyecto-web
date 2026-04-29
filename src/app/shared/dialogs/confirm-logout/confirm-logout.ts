import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-logout-dialog',
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
  templateUrl: './confirm-logout.html',
  styleUrls: ['./confirm-logout.scss']

})
export class ConfirmLogoutDialogComponent {

  constructor(private dialogRef: MatDialogRef<ConfirmLogoutDialogComponent>) {}

  cerrar(valor: boolean) {
    this.dialogRef.close(valor);
  }
}