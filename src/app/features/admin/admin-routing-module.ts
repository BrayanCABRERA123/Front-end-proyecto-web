import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ReportsComponent } from './pages/reports/reports';
import { PaymentsComponent } from './pages/payments/payments';
import { ReservationsComponent } from './pages/reservations/reservations';
import { ManagementComponent } from './pages/management/management';
import { ScheduleComponent } from './pages/schedule/schedule';
import { OperatorsComponent } from './pages/operators/operators';
import { AdminNotificationsComponent } from './pages/notifications/notifications';
import { AdminProfileComponent } from './pages/profile/profile';
import { AdminSettingsComponent } from './pages/settings/settings';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'reservations', component: ReservationsComponent },
  { path: 'payments', component: PaymentsComponent },
  { path: 'management', component: ManagementComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'operators', component: OperatorsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'notifications', component: AdminNotificationsComponent },
  { path: 'profile', component: AdminProfileComponent },
  { path: 'settings', component: AdminSettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }