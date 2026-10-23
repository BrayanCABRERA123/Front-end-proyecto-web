import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api';
import { BusinessDataDto } from '../../../core/models/booking.models';
import { BusinessData } from '../models/admin.models';

const EMPTY_BUSINESS: BusinessData = {
  legalName: '', taxId: '', businessType: '', foundationDate: '', legalRep: '', legalRepDoc: '',
  address: '', phone: '', email: '', website: '',
  taxRegime: '', ciiuActivity: '', dianResolution: '', invoicePrefix: '', invoiceRange: '',
  instagram: '', facebook: '', supportLine: '', serviceHours: '',
};

// vacío se manda como null para que la base no guarde textos en blanco
const orNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

function fromDto(dto: BusinessDataDto): BusinessData {
  return {
    legalName: dto.legalName ?? '',
    taxId: dto.taxId ?? '',
    businessType: dto.businessType ?? '',
    foundationDate: dto.foundedOn ?? '',
    legalRep: dto.legalRepresentative ?? '',
    legalRepDoc: dto.legalRepresentativeDocument ?? '',
    address: dto.address ?? '',
    phone: dto.phone ?? '',
    email: dto.email ?? '',
    website: dto.website ?? '',
    taxRegime: dto.taxRegime ?? '',
    ciiuActivity: dto.ciiuActivity ?? '',
    dianResolution: dto.dianResolution ?? '',
    invoicePrefix: dto.invoicePrefix ?? '',
    invoiceRange: dto.invoiceRange ?? '',
    instagram: dto.instagram ?? '',
    facebook: dto.facebook ?? '',
    supportLine: dto.supportLine ?? '',
    serviceHours: dto.serviceHoursNote ?? '',
  };
}

function toDto(data: BusinessData): BusinessDataDto {
  return {
    tradeName: null, // el nombre comercial no se edita aquí: el backend conserva el actual
    legalName: data.legalName.trim(),
    taxId: data.taxId.trim(),
    businessType: orNull(data.businessType),
    foundedOn: orNull(data.foundationDate),
    legalRepresentative: orNull(data.legalRep),
    legalRepresentativeDocument: orNull(data.legalRepDoc),
    address: data.address.trim(),
    phone: orNull(data.phone),
    email: orNull(data.email),
    website: orNull(data.website),
    taxRegime: orNull(data.taxRegime),
    ciiuActivity: orNull(data.ciiuActivity),
    dianResolution: orNull(data.dianResolution),
    invoicePrefix: orNull(data.invoicePrefix),
    invoiceRange: orNull(data.invoiceRange),
    instagram: orNull(data.instagram),
    facebook: orNull(data.facebook),
    supportLine: orNull(data.supportLine),
    serviceHoursNote: orNull(data.serviceHours),
  };
}

/**
 * Datos del negocio (identidad, información fiscal y canales) de Configuración. Se leen y se
 * guardan en booking-service (GET/PUT /admin/establishment), que valida las reglas; los medios
 * de pago están en payment-service (pantalla "Métodos de pago").
 */
@Injectable({ providedIn: 'root' })
export class BusinessStore {

  private readonly api = inject(BookingApiService);

  readonly empty: BusinessData = EMPTY_BUSINESS;

  load(): Observable<BusinessData> {
    return this.api.businessData().pipe(map(fromDto));
  }

  save(data: BusinessData): Observable<BusinessData> {
    return this.api.saveBusinessData(toDto(data)).pipe(map(fromDto));
  }
}
