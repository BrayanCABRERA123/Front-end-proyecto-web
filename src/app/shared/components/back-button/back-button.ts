import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss'
})
export class BackButtonComponent {

  constructor(
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

}