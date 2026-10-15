import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { OperatorSkillDto, OperatorSkillLevel } from '../../../../../../core/services/operations-api';

export interface OperatorProfileModalData {
  name: string;
  specialty: string;
  skills: OperatorSkillDto[];
}

export interface OperatorProfileModalResult {
  specialty: string;
  skills: OperatorSkillDto[];
}

// los mismos límites que valida operations-service (OperatorProfile)
const MAX_SKILLS = 10;

// edita la especialidad y las habilidades del operario; guardar reemplaza la lista completa
@Component({
  selector: 'app-operator-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './operator-profile-modal.html',
  styleUrl: './operator-profile-modal.scss',
})
export class OperatorProfileModal {

  readonly levels: OperatorSkillLevel[] = ['CERTIFIED', 'EXPERT', 'ADVANCED'];
  readonly maxSkills = MAX_SKILLS;

  specialty: string;
  skills: OperatorSkillDto[];
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<OperatorProfileModal, OperatorProfileModalResult | null>,
    @Inject(MAT_DIALOG_DATA) readonly data: OperatorProfileModalData
  ) {
    this.specialty = data.specialty;
    this.skills = data.skills.map(skill => ({ ...skill }));
  }

  get canAddSkill(): boolean {
    return this.skills.length < MAX_SKILLS;
  }

  get missingName(): boolean {
    return this.skills.some(skill => !skill.name.trim());
  }

  get duplicated(): boolean {
    const names = this.skills.map(skill => skill.name.trim().toLowerCase()).filter(Boolean);
    return new Set(names).size !== names.length;
  }

  addSkill(): void {
    if (this.canAddSkill) this.skills.push({ name: '', level: 'CERTIFIED' });
  }

  removeSkill(index: number): void {
    this.skills.splice(index, 1);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (this.missingName || this.duplicated) return;
    this.dialogRef.close({
      specialty: this.specialty.trim(),
      skills: this.skills.map(skill => ({ name: skill.name.trim(), level: skill.level })),
    });
  }
}
