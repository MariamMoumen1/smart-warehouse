import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { WarehouseService, WarehouseStatus, WarehouseHistory } from '../../service/warehouse';

Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.less'
})
export class Overview implements OnInit, AfterViewInit {
  @ViewChild('historyCanvas') historyCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  status: WarehouseStatus | null = null;
  loading = true;
  errorMsg = '';
  private pendingHistory: WarehouseHistory | null = null;

  constructor(private warehouseService: WarehouseService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadStatus();
    this.loadHistory();
  }

  ngAfterViewInit(): void {
    if (this.pendingHistory) {
      this.renderChart(this.pendingHistory);
    }
  }

  loadStatus(): void {
    this.loading = true;
    this.warehouseService.getStatus().subscribe({
      next: (data: WarehouseStatus) => {
        this.status = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = 'Impossible de contacter le serveur API';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.warehouseService.getHistory().subscribe({
      next: (data: WarehouseHistory) => {
        if (this.historyCanvas) { this.renderChart(data); } else { this.pendingHistory = data; }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => { console.error('Erreur historique', err); }
    });
  }

  renderChart(data: WarehouseHistory): void {
    if (this.chart) { this.chart.destroy(); }
    this.chart = new Chart(this.historyCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: data.heures,
        datasets: [{
          data: data.temps_attente,
          label: 'Temps d\'attente (min)',
          borderColor: '#4527a0',
          backgroundColor: 'rgba(69, 39, 160, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } } }
    });
  }
}
