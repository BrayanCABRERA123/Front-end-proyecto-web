import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarComponent } from "../../../../layout/sidebar/sidebar";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    MatIconModule,
    FormsModule,
    MatSlideToggleModule
  ],

  templateUrl: './configuration.html',
  styleUrls: ['./configuration.scss'] 
})

export class configurationComponent {

  settings = {
    push: true,
    email: true,
    promo: false,
    location: true
  };

  selectedTheme: string = 'light';

  selectedLanguage: string = 'es';

  constructor(  ){}

  changeTheme(theme: string){
    this.selectedTheme = theme;
  }

  changeLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  saveSecttings(){
    console.log('Configuracion guardada',{
    settings: this.settings,
    theme: this.changeTheme,
    language: this.changeLanguage
    });
  }
}