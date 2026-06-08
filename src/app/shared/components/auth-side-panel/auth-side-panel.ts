import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-side-panel',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './auth-side-panel.html',
  styleUrl: './auth-side-panel.scss'
})
export class AuthSidePanelComponent {}