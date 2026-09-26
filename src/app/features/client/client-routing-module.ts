import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// importamos las páginas
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProfileComponent } from './pages/profile/profile';
import { ReserveComponent } from './pages/reserve/reserve';
import { ClientNotificationsComponent } from './pages/notifications/notifications';
import { HistoryComponent } from './pages/history/history';
import { ConfigurationComponent } from './pages/configuration/configuration';
import { PaymentComponent } from './pages/payment/payment';
import { VehiclesComponent } from './pages/vehicles/vehicles';



const routes: Routes = [
  // importamos las rutas
  { path: '', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'reserve', component: ReserveComponent },
  { path: 'notifications', component: ClientNotificationsComponent},
  { path: 'history', component: HistoryComponent },
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'payment', component: PaymentComponent },
  { path: 'vehicles', component: VehiclesComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
