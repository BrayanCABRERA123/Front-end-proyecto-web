import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './features.html',
  styleUrl: './features.scss'
})
export class FeaturesComponent {

  features = [
    {
      icon: 'water_drop',
      title: 'FEATURES.ITEMS.ECO.TITLE',
      description: 'FEATURES.ITEMS.ECO.DESC'
    },
    {
      icon: 'shield',
      title: 'FEATURES.ITEMS.PROTECTION.TITLE',
      description: 'FEATURES.ITEMS.PROTECTION.DESC'
    },
    {
      icon: 'star',
      title: 'FEATURES.ITEMS.RATING.TITLE',
      description: 'FEATURES.ITEMS.RATING.DESC'
    }
  ];
}
