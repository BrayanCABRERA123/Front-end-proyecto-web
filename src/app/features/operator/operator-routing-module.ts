import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// importamos el home del operator
import { HomeComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { AssignedServicesComponent } from './pages/assigned-services/assigned-services';
import { OperatorNotificationsComponent } from '../operator/pages/notifications/notifications';
import { ServiceHistoryComponent } from './pages/service-history/service-history';
import { QualificationsComponent } from './pages/qualifications/qualifications';
import { ConfigurationOperatorComponent } from './pages/configuration-operator/configuration-operator';
import { ScheduleComponent } from './pages/schedule/schedule';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // las tareas del operario son sus servicios asignados (la vieja ruta era solo una plantilla vacía)
  { path: 'tasks', redirectTo: 'assigned-services', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent },
  { path: 'assigned-services', component: AssignedServicesComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'notifications', component: OperatorNotificationsComponent },
  { path: 'service-history', component: ServiceHistoryComponent },
  { path: 'qualifications', component: QualificationsComponent },
  { path: 'settings', component: ConfigurationOperatorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperatorRoutingModule {}