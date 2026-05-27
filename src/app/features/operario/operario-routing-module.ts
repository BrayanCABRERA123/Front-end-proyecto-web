import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TasksComponent } from './pages/tasks/tasks';
// importamos el home del operario
import { HomeComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { AssignedServicesComponent } from './pages/assigned-services/assigned-services';
import { notificationsComponent } from '../operario/pages/notifications/notifications';
import { ServiceHistoryComponent } from './pages/service-history/service-history';
import { QualificationsComponent } from './pages/qualifications/qualifications';
import { ConfigurationOperarioComponent } from './pages/configuration-operario/configuration-operario';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // ruta para tareas
  { path: 'tasks', component: TasksComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'assigned-services', component: AssignedServicesComponent },
  { path: 'notifications', component: notificationsComponent },
  { path: 'service-history', component: ServiceHistoryComponent },
  { path: 'qualifications', component: QualificationsComponent },
  { path: 'settings', component: ConfigurationOperarioComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperarioRoutingModule {}