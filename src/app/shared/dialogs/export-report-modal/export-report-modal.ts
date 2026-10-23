import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MiniReport { services: number; revenue: number; }
interface SoldService { name: string; sales: number; }

interface ExportReportData {
  dayReport: MiniReport;
  weekReport: MiniReport;
  monthReport: MiniReport;
  yearRevenue: number;
  topServices: SoldService[];
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

  close() {
    this.dialogRef.close();
  }

  // arma las filas de la tabla del reporte (reutilizadas por PDF y Excel)
  private reportRows(): string[][] {
    const t = (key: string) => this.translate.instant(key);

    return [
      [t('REPORTS.SUMMARY.DAY'), String(this.data.dayReport.services), '$' + this.data.dayReport.revenue],
      [t('REPORTS.SUMMARY.WEEK'), String(this.data.weekReport.services), '$' + this.data.weekReport.revenue],
      [t('REPORTS.SUMMARY.MONTH'), String(this.data.monthReport.services), '$' + this.data.monthReport.revenue]
    ];
  }

  exportPDF(): void {
    const t = (key: string) => this.translate.instant(key);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(t('REPORTS.TITLE'), 14, 18);

    doc.setFontSize(11);
    doc.text(`${t('REPORTS.YEAR_REVENUE')}: $${this.data.yearRevenue}`, 14, 28);

    autoTable(doc, {
      startY: 36,
      head: [[t('REPORTS.MODAL.PERIOD'), t('REPORTS.SUMMARY.SERVICES_DONE'), t('REPORTS.SUMMARY.TOTAL_REVENUE')]],
      body: this.reportRows()
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(t('REPORTS.TOP_SERVICES.TITLE'), 14, finalY);

    autoTable(doc, {
      startY: finalY + 6,
      head: [[t('REPORTS.MODAL.SERVICE'), t('REPORTS.TOP_SERVICES.SALES')]],
      body: this.data.topServices.map(s => [s.name, String(s.sales)])
    });

    doc.save('reporte-lavado-vehicular.pdf');
  }

  exportExcel(): void {
    const t = (key: string) => this.translate.instant(key);

    const summarySheet = XLSX.utils.aoa_to_sheet([
      [t('REPORTS.MODAL.PERIOD'), t('REPORTS.SUMMARY.SERVICES_DONE'), t('REPORTS.SUMMARY.TOTAL_REVENUE')],
      ...this.reportRows()
    ]);

    const topSheet = XLSX.utils.aoa_to_sheet([
      [t('REPORTS.MODAL.SERVICE'), t('REPORTS.TOP_SERVICES.SALES')],
      ...this.data.topServices.map(s => [s.name, s.sales])
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, topSheet, 'Top servicios');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'reporte-lavado-vehicular.xlsx');
  }

}
