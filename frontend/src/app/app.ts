import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WarehouseService } from './service/warehouse';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  title = 'smart-warehouse';
  exportingPdf = false;
  exportingExcel = false;

  constructor(private warehouseService: WarehouseService) {}

  exportPdf(): void {
    this.exportingPdf = true;
    this.warehouseService.downloadPdfReport().subscribe({
      next: (blob: Blob) => {
        this.triggerDownload(blob, 'rapport_smart_warehouse.pdf');
        this.exportingPdf = false;
      },
      error: () => { this.exportingPdf = false; }
    });
  }

  exportExcel(): void {
    this.exportingExcel = true;
    this.warehouseService.downloadExcelReport().subscribe({
      next: (blob: Blob) => {
        this.triggerDownload(blob, 'rapport_smart_warehouse.xlsx');
        this.exportingExcel = false;
      },
      error: () => { this.exportingExcel = false; }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
