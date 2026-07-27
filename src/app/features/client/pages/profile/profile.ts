import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del client
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos el componente compartido de perfil
import { ProfileCardComponent } from '../../../../shared/components/profile-card/profile-card';
import { ProfileViewModel } from './profile.viewmodel';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProfileCardComponent],
  providers: [ProfileViewModel],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {

  constructor(public vm: ProfileViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }
}