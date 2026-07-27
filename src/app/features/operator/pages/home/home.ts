import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { StatsCardComponent } from './components/stats-card/stats-card';
import { PendingServiceCardComponent } from './components/pending-service-card/pending-service-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { OperatorHomeViewModel } from './home.viewmodel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    PendingServiceCardComponent,
    MatIconModule,
    TranslateModule
  ],
  providers: [OperatorHomeViewModel],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {

  constructor(public vm: OperatorHomeViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }
}