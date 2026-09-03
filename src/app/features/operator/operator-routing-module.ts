import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TasksComponent } from './pages/tasks/tasks';
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
  // ruta para tareas
  { path: 'tasks', component: TasksComponent },
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