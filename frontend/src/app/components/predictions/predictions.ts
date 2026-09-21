import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WarehouseService, PredictionInput, PredictionRecord } from '../../service/warehouse';

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictions.html',
  styleUrl: './predictions.less'
})
export class Predictions implements OnInit {
  predictionForm: PredictionInput = { heure: 14, jour_semaine: 2, camions_entrants: 8, niveau_stock: 3200, temperature: 24 };
  predictedTime: number | null = null;
  predicting = false;
  errorMsg = '';
  history: PredictionRecord[] = [];
  loadingHistory = true;

  jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(private warehouseService: WarehouseService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loadingHistory = true;
    this.warehouseService.getPredictionsHistory().subscribe({
      next: (data: PredictionRecord[]) => {
        this.history = data;
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.loadingHistory = false;
        console.error(err);
      }
    });
  }

  runPrediction(): void {
    this.errorMsg = '';
    this.predicting = true;
    this.warehouseService.predict(this.predictionForm).subscribe({
      next: (result: PredictionRecord) => {
        this.predictedTime = result.resultat;
        this.predicting = false;
        this.history.unshift(result);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = `Erreur lors de la prédiction (code ${err.status}).`;
        this.predicting = false;
        this.cdr.detectChanges();
      }
    });
  }

  getNiveauLabel(minutes: number): string {
    if (minutes < 10) return 'Faible';
    if (minutes < 20) return 'Modéré';
    return 'Élevé';
  }
}
