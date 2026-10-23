import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// columnas y filas de cualquier tabla del admin que quiera exportarse
export interface ExportColumn {
  key: string;
  labelKey: string;
}

export interface ExportDataModalData {
  /** llave de traducción del título (ej. 'ADMIN_RESERVATIONS') */
  titleKey: string;
  /** llave de traducción del subtítulo */
  subtitleKey?: string;
  /** base del nombre del archivo que se va a descargar */
  fileName: string;
  /** columnas en el orden en que se exportan */
  columns: ExportColumn[];
  /** filas con los mismos valores de las columnas */
  rows: Record<string, string | number>[];
  /** título fijo del documento, con el que se imprime el PDF */
  documentTitle?: string;
}

@Component({
  selector: 'app-export-data-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './export-data-modal.html',
  styleUrl: './export-data-modal.scss',
})
export class ExportDataModal {

  constructor(
    private dialogRef: MatDialogRef<ExportDataModal>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: ExportDataModalData,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  /** convierte el dato de una celda a texto seguro para exportar */
  private cellVal(row: Record<string, string | number>, column: ExportColumn): string {
    return String(row[column.key] ?? '');
  }

  // tabla con encabezados traducidos en el mismo orden de las columnas
  private table(): { head: string[][]; body: string[][] } {
    const head = [this.data.columns.map(c => this.translate.instant(c.labelKey))];
    const body = this.data.rows.map(r => this.data.columns.map(c => this.cellVal(r, c)));
    return { head, body };
  }

  private docTitle(): string {
    return (this.translate.instant(this.data.titleKey) || this.data.documentTitle || this.data.fileName) as string;
  }

  exportCsv(): void {
    const { head, body } = this.table();
    const lines = [...head, ...body]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    saveAs(new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8' }), `${this.data.fileName}.csv`);
  }

  exportExcel(): void {
    const { head, body } = this.table();

    const sheet = XLSX.utils.aoa_to_sheet([...head, ...body]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, this.docTitle().slice(0, 31));

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${this.data.fileName}.xlsx`);
  }

  exportPdf(): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(this.docTitle(), 14, 18);

    doc.setFontSize(10);
    doc.text(this.translate.instant('EXPORT_DATA.GENERATED_AT') + ': ' + new Date().toLocaleString(), 14, 26);
    doc.text(this.translate.instant('EXPORT_DATA.SHEET_COUNT') + ': ' + this.data.rows.length, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: this.table().head,
      body: this.table().body,
    });

    doc.save(`${this.data.fileName}.pdf`);
  }
}