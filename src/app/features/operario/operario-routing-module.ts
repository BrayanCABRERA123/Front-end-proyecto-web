import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TasksComponent } from './pages/tasks/tasks';
// importamos el home del operario
import { HomeComponent } from './pages/home/home';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // ruta para tareas
  { path: 'tasks', component: TasksComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperarioRoutingModule {}