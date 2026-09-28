import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BayStatus, Booking, BookingFormValue, BookingStatus } from '../../../../models/admin.models';

export interface BookingModalOption {
  id: string;
  name: string;
  initials?: string;
  status?: BayStatus;
  durationMin?: number;
}

export interface BookingModalData {
  /** presente cuando se edita una reserva existente */
  booking?: Booking;
  bays: BookingModalOption[];
  operators: BookingModalOption[];
  services: BookingModalOption[];
}

export type BookingModalResult = BookingFormValue;

const PLATE_RE = /^[A-Z0-9-]{4,10}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.scss',
})
export class BookingModal {

  // una reserva nueva siempre nace confirmada
  readonly statuses: { value: BookingStatus; labelKey: string }[] = [
    { value: 'confirmed', labelKey: 'ADMIN_RESERVATIONS.STATUS.confirmed' },
    { value: 'in_progress', labelKey: 'ADMIN_RESERVATIONS.STATUS.in_progress' },
    { value: 'completed', labelKey: 'ADMIN_RESERVATIONS.STATUS.completed' },
    { value: 'cancelled', labelKey: 'ADMIN_RESERVATIONS.STATUS.cancelled' },
  ];

  client = '';
  phone = '';
  email = '';
  vehicle = '';
  plate = '';
  service = '';
  date = '';
  time = '09:00';
  durationMin = 60;
  bayId: string | null = null;
  operatorId: string | null = null;
  notes = '';

  status: BookingStatus = 'confirmed';
  editing = false;
  submitted = false;

  bays: BookingModalOption[] = [];
  operators: BookingModalOption[] = [];
  services: BookingModalOption[] = [];

  constructor(
    private dialogRef: MatDialogRef<BookingModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: BookingModalData | null,
  ) {
    this.bays = data?.bays ?? [];
    this.operators = data?.operators ?? [];
    this.services = data?.services ?? [];

    const booking = data?.booking;
    if (booking) {
      this.editing = true;
      this.client = booking.client;
      this.phone = booking.phone;
      this.email = booking.email;
      this.vehicle = booking.vehicle;
      this.plate = booking.plate;
      this.service = booking.service;
      this.date = booking.date;
      this.time = booking.time;
      this.durationMin = booking.durationMin;
      this.bayId = this.bays.find(b => b.name === booking.bay)?.id ?? null;
      this.operatorId = booking.operator?.id ?? null;
      this.notes = booking.notes;
      this.status = booking.status;
    } else {
      this.date = new Date().toISOString().slice(0, 10);
      if (this.services.length) {
        this.service = this.services[0].name;
        this.durationMin = this.services[0].durationMin ?? 60;
      }
    }
  }

  // al elegir un servicio se completa la duración de ese catálogo
  onServiceChange(): void {
    const found = this.services.find(s => s.name === this.service);
    if (found?.durationMin) this.durationMin = found.durationMin;
  }

  get canSave(): boolean {
    return (
      this.client.trim().length >= 3 &&
      PHONE_RE.test(this.phone.trim()) &&
      this.vehicle.trim().length >= 2 &&
      PLATE_RE.test(this.plate.trim().toUpperCase()) &&
      this.service.trim().length > 0 &&
      !!this.date &&
      !!this.time
    );
  }

  get plateInvalid(): boolean {
    return this.submitted && !PLATE_RE.test(this.plate.trim().toUpperCase());
  }

  get phoneInvalid(): boolean {
    return this.submitted && !PHONE_RE.test(this.phone.trim());
  }

  get clientInvalid(): boolean {
    return this.submitted && this.client.trim().length < 3;
  }

  get vehicleInvalid(): boolean {
    return this.submitted && this.vehicle.trim().length < 2;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const result: BookingModalResult = {
      client: this.client.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      vehicle: this.vehicle.trim(),
      plate: this.plate.trim().toUpperCase(),
      service: this.service,
      date: this.date,
      time: this.time,
      durationMin: this.durationMin,
      bay: this.bays.find(b => b.id === this.bayId)?.name ?? null,
      status: this.status,
      operatorId: this.operatorId,
      notes: this.notes.trim(),
    };

    this.dialogRef.close(result);
  }
}