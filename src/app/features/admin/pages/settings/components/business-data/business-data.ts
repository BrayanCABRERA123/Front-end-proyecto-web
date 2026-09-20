import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// info fiscal/corporativa del negocio (mockup img 1).
// datos de ejemplo: reemplazar por los reales de la empresa antes de producción
interface BusinessData {
  legalName: string;
  taxId: string;
  businessType: string;
  foundationDate: string;
  legalRep: string;
  legalRepDoc: string;

  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;

  taxRegime: string;
  ciiuActivity: string;
  dianResolution: string;
  invoicePrefix: string;
  invoiceRange: string;
  electronicInvoicing: boolean;

  instagram: string;
  facebook: string;
  supportLine: string;
  serviceHours: string;
}

@Component({
  selector: 'app-business-data',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './business-data.html',
  styleUrl: './business-data.scss'
})
export class BusinessDataComponent {

  data: BusinessData = {
    legalName: 'Express Car Wash S.A.S.',
    taxId: '901.482.930-1',
    businessType: 'Lavado y Detailing Automotriz',
    foundationDate: '2019-03-15',
    legalRep: 'Laura Méndez Ríos',
    legalRepDoc: 'CC 1.032.456.789',

    address: 'Calle 127 #19A-48, Bogotá, Colombia',
    phone: '+57 312 490 8821',
    whatsapp: '+57 312 490 8821',
    email: 'contacto@expresscarwash.co',
    website: 'www.expresscarwash.co',

    taxRegime: 'Responsable de IVA 19% · Régimen Ordinario Común',
    ciiuActivity: '4520 - Mantenimiento y reparación de vehículos',
    dianResolution: 'No. 18764002345678',
    invoicePrefix: 'LV',
    invoiceRange: '4500-5500',
    electronicInvoicing: true,

    instagram: '@expresscarwash_oficial',
    facebook: 'Express Car Wash S.A.S.',
    supportLine: '018000-123-456',
    serviceHours: 'Lunes a sábado 7:00 AM - 6:30 PM'
  };

  // snapshot para poder "Descartar" y volver a como estaba
  private savedData: BusinessData = { ...this.data };

  discard(): void {
    this.data = { ...this.savedData };
  }

  save(): void {
    this.savedData = { ...this.data };
  }
}
