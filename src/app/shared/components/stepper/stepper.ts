import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss'
})
export class StepperComponent {

  // Recibe el paso actual desde el componente padre
  // Ejemplo de uso: <app-stepper [currentStep]="2" />
  @Input() currentStep: number = 1;

  // Arreglo con los 3 pasos
  steps: number[] = [1, 2, 3];

  // Regresa true si el paso ya fue completado
  isCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  // Regresa true si el paso está activo ahora mismo
  isActive(step: number): boolean {
    return step === this.currentStep;
  }
}