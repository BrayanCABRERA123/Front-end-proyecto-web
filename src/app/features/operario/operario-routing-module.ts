import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TasksComponent } from './pages/tasks/tasks';
// importamos el home del operario
import { HomeComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { AssignedServicesComponent } from './pages/assigned-services/assigned-services';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // ruta para tareas
  { path: 'tasks', component: TasksComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'assigned-services', component: AssignedServicesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperarioRoutingModule {}