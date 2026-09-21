import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface WarehouseStatus {
  niveau_stock: number;
  capacite_max: number;
  camions_entrants: number;
  camions_en_attente: number;
  alertes: { type: string; message: string }[];
}

export interface PredictionInput {
  heure: number;
  jour_semaine: number;
  camions_entrants: number;
  niveau_stock: number;
  temperature: number;
}

export interface PredictionRecord {
  id: number;
  heure: number;
  jour_semaine: number;
  camions_entrants: number;
  niveau_stock: number;
  temperature: number;
  resultat: number;
  created_at: string;
}

export interface WarehouseHistory {
  heures: string[];
  temps_attente: number[];
}

export interface Truck {
  id: number;
  plaque: string;
  statut: string;
  temps_attente_min: number | null;
  created_at: string;
}

export interface TruckCreate {
  plaque: string;
  statut: string;
  temps_attente_min?: number | null;
}

export interface WsEvent {
  event: string;
  plaque: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private apiUrl = 'http://127.0.0.1:8000';
  private wsUrl = 'ws://127.0.0.1:8000/ws';
  private socket: WebSocket | null = null;
  public wsEvents = new Subject<WsEvent>();

  constructor(private http: HttpClient) {
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onmessage = (event) => {
      const data: WsEvent = JSON.parse(event.data);
      this.wsEvents.next(data);
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  getStatus(): Observable<WarehouseStatus> {
    return this.http.get<WarehouseStatus>(`${this.apiUrl}/warehouse/status`);
  }

  getHistory(): Observable<WarehouseHistory> {
    return this.http.get<WarehouseHistory>(`${this.apiUrl}/warehouse/history`);
  }

  predict(data: PredictionInput): Observable<PredictionRecord> {
    return this.http.post<PredictionRecord>(`${this.apiUrl}/predict`, data);
  }

  getPredictionsHistory(): Observable<PredictionRecord[]> {
    return this.http.get<PredictionRecord[]>(`${this.apiUrl}/predictions/history`);
  }

  getTrucks(): Observable<Truck[]> {
    return this.http.get<Truck[]>(`${this.apiUrl}/trucks`);
  }

  createTruck(truck: TruckCreate): Observable<Truck> {
    return this.http.post<Truck>(`${this.apiUrl}/trucks`, truck);
  }

  updateTruck(id: number, truck: Partial<TruckCreate>): Observable<Truck> {
    return this.http.put<Truck>(`${this.apiUrl}/trucks/${id}`, truck);
  }

  deleteTruck(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/trucks/${id}`);
  }

  downloadPdfReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/pdf`, { responseType: 'blob' });
  }

  downloadExcelReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/excel`, { responseType: 'blob' });
  }
}
