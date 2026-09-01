import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// importamos las páginas
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProfileComponent } from './pages/profile/profile';
import { RatingModalComponent } from '../../shared/dialogs/rating-modal/rating-modal';
import { ReserveComponent } from './pages/reserve/reserve';
import { ClientNotificationsComponent } from './pages/notifications/notifications';
import { HistoryComponent } from './pages/history/history';
import { ConfigurationComponent } from './pages/configuration/configuration';
import { PaymentComponent } from './pages/payment/payment';



const routes: Routes = [
  // importamos las rutas
  { path: '', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'ratings', component: RatingModalComponent},
  { path: 'reserve', component: ReserveComponent },
  { path: 'notifications', component: ClientNotificationsComponent},
  { path: 'history', component: HistoryComponent },
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'payment', component: PaymentComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
