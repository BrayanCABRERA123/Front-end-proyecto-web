import { Component, OnInit, inject } from '@angular/core';
import { NavbarComponent } from '../components/navbar/navbar';
import { HeroComponent } from '../components/hero/hero';
import { FeaturesComponent } from '../components/features/features';
import { ServicesComponent } from '../components/services/services';
import { ContactComponent } from '../components/contact/contact';
import { FooterComponent } from '../components/footer/footer';
import { DownloadComponent } from '../components/download/download';
import { FaqComponent } from '../components/faq/faq';
import { LandingViewModel } from '../viewmodels/landing.viewmodel';

// los datos de las secciones (precios, contacto, descarga) los carga LandingViewModel
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavbarComponent, HeroComponent, FeaturesComponent, ServicesComponent, DownloadComponent, ContactComponent, FaqComponent, FooterComponent],
  providers: [LandingViewModel],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent implements OnInit {

  private readonly vm = inject(LandingViewModel);

  ngOnInit(): void {
    this.vm.load();
  }
}
