import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReporteMini { servicios: number; ingresos: number; }
interface ServicioVendido { nombre: string; ventas: number; }

interface ExportReportData {
  reporteDia: ReporteMini;
  reporteSemana: ReporteMini;
  reporteMes: ReporteMini;
  ingresosAnio: number;
  serviciosMasVendidos: ServicioVendido[];
}

@Component({
  selector: 'app-export-report-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './export-report-modal.html',
  styleUrls: ['./export-report-modal.scss']
})
export class ExportReportModalComponent {

  constructor(
    private dialogRef: MatDialogRef<ExportReportModalComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: ExportReportData
  ) {}

  cerrar() {
    this.dialogRef.close();
  }

  // arma las filas de la tabla del reporte (reutilizadas por PDF y Excel)
  private filasReporte(): string[][] {
    const t = (clave: string) => this.translate.instant(clave);

    return [
      [t('REPORTS.SUMMARY.DAY'), String(this.data.reporteDia.servicios), '$' + this.data.reporteDia.ingresos],
      [t('REPORTS.SUMMARY.WEEK'), String(this.data.reporteSemana.servicios), '$' + this.data.reporteSemana.ingresos],
      [t('REPORTS.SUMMARY.MONTH'), String(this.data.reporteMes.servicios), '$' + this.data.reporteMes.ingresos]
    ];
  }

  exportarPDF(): void {
    const t = (clave: string) => this.translate.instant(clave);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(t('REPORTS.TITLE'), 14, 18);

    doc.setFontSize(11);
    doc.text(`${t('REPORTS.YEAR_REVENUE')}: $${this.data.ingresosAnio}`, 14, 28);

    autoTable(doc, {
      startY: 36,
      head: [[t('REPORTS.MODAL.PERIOD'), t('REPORTS.SUMMARY.SERVICES_DONE'), t('REPORTS.SUMMARY.TOTAL_REVENUE')]],
      body: this.filasReporte()
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(t('REPORTS.TOP_SERVICES.TITLE'), 14, finalY);

    autoTable(doc, {
      startY: finalY + 6,
      head: [[t('REPORTS.MODAL.SERVICE'), t('REPORTS.TOP_SERVICES.SALES')]],
      body: this.data.serviciosMasVendidos.map(s => [s.nombre, String(s.ventas)])
    });

    doc.save('reporte-lavado-vehicular.pdf');
  }

  exportarExcel(): void {
    const t = (clave: string) => this.translate.instant(clave);

    const hojaResumen = XLSX.utils.aoa_to_sheet([
      [t('REPORTS.MODAL.PERIOD'), t('REPORTS.SUMMARY.SERVICES_DONE'), t('REPORTS.SUMMARY.TOTAL_REVENUE')],
      ...this.filasReporte()
    ]);

    const hojaTop = XLSX.utils.aoa_to_sheet([
      [t('REPORTS.MODAL.SERVICE'), t('REPORTS.TOP_SERVICES.SALES')],
      ...this.data.serviciosMasVendidos.map(s => [s.nombre, s.ventas])
    ]);

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen');
    XLSX.utils.book_append_sheet(libro, hojaTop, 'Top servicios');

    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'reporte-lavado-vehicular.xlsx');
  }

}
