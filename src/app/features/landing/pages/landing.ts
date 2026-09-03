import { Component } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar';
import { HeroComponent } from '../components/hero/hero';
import { FeaturesComponent } from '../components/features/features';
import { ServicesComponent } from '../components/services/services';
import { ContactComponent } from '../components/contact/contact';
import { FooterComponent } from '../components/footer/footer';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavbarComponent, HeroComponent, FeaturesComponent, ServicesComponent, ContactComponent, FooterComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent {}
