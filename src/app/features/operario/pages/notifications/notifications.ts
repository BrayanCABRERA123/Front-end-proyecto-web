import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, SidebarComponent, MatIconModule, FormsModule],
    templateUrl: './notifications.html',
    styleUrls: ['./notifications.scss']
})
export class notificationsComponent {

    filtroFecha: string = '';
    filtroTipoServicio: string = '';
    filtroVehiculo: string = '';

    tiposServicio = [
        { value: '', label: 'Todas' },
        { value: 'premium', label: 'Premium' },
        { value: 'basico', label: 'Básico' }
    ];

    notifications = [
        {
            icon: 'event',
            title: 'Nuevo servicio asignado',
            desc: 'SV-2034 te ha sido asignado para las 3:00 p.m.',
            date: '12/03/2025 - 09:14',
            read: false
        },
        {
            icon: 'notifications',
            title: 'Actualización de estado',
            desc: 'El client confirmó la dirección para el servicio SV-1783.',
            date: '11/03/2025 - 14:30',
            read: true
        },
        {
            icon: 'warning',
            title: 'Cancelación',
            desc: 'El client ha cancelado el servicio SV-1690.',
            date: '10/03/2025 - 10:00',
            read: false
        },
        {
            icon: 'chat',
            title: 'Mensaje del client',
            desc: '"Voy a estar 5 minutos tarde, por favor esperarme."',
            date: '04/03/2025 - 16:45',
            read: true
        },
        {
            icon: 'desktop_windows',
            title: 'Sistema',
            desc: 'Tu perfil ha sido actualizado correctamente.',
            date: '08/03/2025 - 08:00',
            read: true
        }
    ];

    resetFiltros() {
        this.filtroFecha = '';
        this.filtroTipoServicio = '';
        this.filtroVehiculo = '';
    }
}