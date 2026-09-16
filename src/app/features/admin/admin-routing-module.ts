import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ReportsComponent } from './pages/reports/reports';
import { PaymentsComponent } from './pages/payments/payments';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'payments', component: PaymentsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }