import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos el componente compartido de perfil
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { OperatorProfileViewModel } from './profile.viewmodel';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  providers: [OperatorProfileViewModel],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {

  constructor(public vm: OperatorProfileViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }
}