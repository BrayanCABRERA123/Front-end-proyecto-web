import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';


@Component({
    selector: 'app-notifications',
    imports:[CommonModule, SidebarComponent, MatIconModule],
    templateUrl: './notifications.html',
    styleUrl: './notifications.scss'

})
export class notificationsComponent {

    notifications = [
        {
            icon: 'event',
            title: 'Reserva Confirmada',
            desc: 'Tu lavado Premium está programado para el 25 Feb a las 10:00 AM',
            time: 'Hace 2 horas'
        },
        {
            icon: 'notifications',
            title: 'Recordatorio',
            desc: 'Tu lavado está programado para mañana. ¿Todo listo?',
            time: 'Hace 1 día'
        },
        {
            icon: 'card_giftcard',
            title: '¡Promoción Especial!',
            desc: 'Obtén 20% de descuento en tu próximo lavado Completo. Usa código: AQUA20',
            time: 'Hace 2 días'
        },
        {
            icon: 'info',
            title: 'Actualización de Servicio',
            desc: 'Hemos ampliado nuestra cobertura a nuevas zonas de la ciudad',
            time: 'Hace 3 días'
        }
    ];

}