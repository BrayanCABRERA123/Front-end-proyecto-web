import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLogoutDialogComponent } from '../../../shared/dialogs/confirm-logout/confirm-logout';
import { SidebarRole, SidebarViewModel } from '../../viewmodels/sidebar.viewmodel';

// menú lateral: las opciones por rol, el usuario y las no leídas están en SidebarViewModel
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  providers: [SidebarViewModel],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit {

  readonly vm = inject(SidebarViewModel);
  private readonly dialog = inject(MatDialog);

  @Input() rol: SidebarRole = 'CLIENT';
  // controla si el sidebar está abierto en mobile
  isOpen: boolean = false;

  ngOnInit(): void {
    this.vm.start(this.rol);
  }

  // abre o cierra el sidebar en mobile
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // cierra el sidebar al hacer clic en un item
  closeSidebar(): void {
    this.isOpen = false;
  }

  logout() {
    this.dialog.open(ConfirmLogoutDialogComponent, {
      panelClass: 'custom-dialog'
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.vm.logout();
    });
  }
}
