import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// importamos las páginas
import { HomeComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { Payments } from './pages/payments/payments';
import { RatingsComponent } from './pages/ratings/ratings';
import { ReserveComponent } from './pages/reserve/reserve';
import { notificationsComponent } from './pages/notifications/notifications';
import { HistoryComponent } from './pages/history/history';



const routes: Routes = [
  // importamos las rutas
  { path: '', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'payments', component: Payments },
  { path: 'ratings', component: RatingsComponent},
  { path: 'reserve', component: ReserveComponent },
  { path: 'notifications', component: notificationsComponent},
  { path: 'history', component: HistoryComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClienteRoutingModule {}
