import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// 1. Importas el archivo de rutas 
import { AdminRoutingModule } from './admin-routing-module';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule
  ],
})
export class AdminModule { }