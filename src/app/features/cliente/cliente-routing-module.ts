import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../modules/pages/home/home';
import { ProfileComponent } from '../modules/pages/profile/profile';
import { Payments } from '../modules/pages/payments/payments';
import { RatingsComponent } from '../modules/pages/ratings/ratings';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'payments', component: Payments },
  { path: 'ratings', component: RatingsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClienteRoutingModule {}
