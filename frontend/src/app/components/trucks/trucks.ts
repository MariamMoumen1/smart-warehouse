import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { WarehouseService, Truck, TruckCreate } from '../../service/warehouse';

@Component({
  selector: 'app-trucks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trucks.html',
  styleUrl: './trucks.less'
})
export class Trucks implements OnInit, OnDestroy {
  trucks: Truck[] = [];
  loading = true;
  errorMsg = '';
  liveNotice = '';
  newTruck: TruckCreate = { plaque: '', statut: 'en_attente', temps_attente_min: null };
  submitting = false;
  editingId: number | null = null;
  editStatut = '';
  private wsSub: Subscription | null = null;

  constructor(private warehouseService: WarehouseService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTrucks();
    this.wsSub = this.warehouseService.wsEvents.subscribe((evt) => {
      const messages: any = {
        truck_created: 'Nouveau camion ajoute : ' + evt.plaque,
        truck_updated: 'Camion mis a jour : ' + evt.plaque,
        truck_deleted: 'Camion supprime : ' + evt.plaque
      };
      this.liveNotice = messages[evt.event] || '';
      this.loadTrucks();
      setTimeout(() => { this.liveNotice = ''; this.cdr.detectChanges(); }, 4000);
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  loadTrucks(): void {
    this.loading = true;
    this.warehouseService.getTrucks().subscribe({
      next: (data: Truck[]) => { this.trucks = data; this.loading = false; this.cdr.detectChanges(); },
      error: (err: HttpErrorResponse) => { this.errorMsg = 'Impossible de charger les camions'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  addTruck(): void {
    this.errorMsg = '';
    if (!this.newTruck.plaque || !this.newTruck.plaque.trim()) {
      this.errorMsg = 'La plaque est obligatoire';
      this.cdr.detectChanges();
      return;
    }
    this.submitting = true;
    this.warehouseService.createTruck(this.newTruck).subscribe({
      next: () => {
        this.newTruck = { plaque: '', statut: 'en_attente', temps_attente_min: null };
        this.submitting = false;
        this.loadTrucks();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = err.status === 500 ? 'Cette plaque existe deja' : 'Erreur lors de la creation';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  startEdit(truck: Truck): void { this.editingId = truck.id; this.editStatut = truck.statut; }
  cancelEdit(): void { this.editingId = null; }

  saveEdit(truck: Truck): void {
    this.warehouseService.updateTruck(truck.id, { statut: this.editStatut }).subscribe({
      next: () => { this.editingId = null; this.loadTrucks(); },
      error: (err: HttpErrorResponse) => { this.errorMsg = 'Erreur lors de la mise a jour'; this.cdr.detectChanges(); }
    });
  }

  deleteTruck(id: number): void {
    if (!confirm('Supprimer ce camion ?')) return;
    this.warehouseService.deleteTruck(id).subscribe({
      next: () => this.loadTrucks(),
      error: (err: HttpErrorResponse) => { this.errorMsg = 'Erreur lors de la suppression'; this.cdr.detectChanges(); }
    });
  }
}
