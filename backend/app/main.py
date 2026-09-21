from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import random
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app import models, schemas
app = FastAPI(title="Smart Warehouse API")
Base.metadata.create_all(bind=engine)

# Autoriser Angular (localhost:4200) à appeler cette API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle entraîné une seule fois au démarrage
model = joblib.load("app/ml/model.pkl")

# Définir la structure des données attendues pour une prédiction
class PredictionInput(BaseModel):
    heure: int
    jour_semaine: int
    camions_entrants: int
    niveau_stock: int
    temperature: float

@app.get("/")
def root():
    return {"message": "Smart Warehouse API is running"}

@app.get("/warehouse/status")
def get_warehouse_status(db: Session = Depends(get_db)):
    """Retourne un état actuel de l'entrepôt avec alertes dynamiques basées sur les vraies données"""
    camions_en_attente = db.query(models.Truck).filter(models.Truck.statut == "en_attente").count()
    camions_en_cours = db.query(models.Truck).filter(models.Truck.statut == "en_cours").count()
    total_camions = db.query(models.Truck).count()

    niveau_stock = 3200
    capacite_max = 5000
    taux_occupation = (niveau_stock / capacite_max) * 100

    alertes = []

    # Alertes basées sur le nombre de camions en attente
    if camions_en_attente >= 5:
        alertes.append({"type": "danger", "message": f"Congestion élevée : {camions_en_attente} camions en attente"})
    elif camions_en_attente >= 2:
        alertes.append({"type": "warning", "message": f"{camions_en_attente} camions en attente de traitement"})
    else:
        alertes.append({"type": "info", "message": "Flux normal, peu de camions en attente"})

    # Alertes basées sur le niveau de stock
    if taux_occupation >= 90:
        alertes.append({"type": "danger", "message": f"Stock critique : {round(taux_occupation)}% de capacité"})
    elif taux_occupation >= 70:
        alertes.append({"type": "warning", "message": f"Stock élevé : {round(taux_occupation)}% de capacité"})

    return {
        "niveau_stock": niveau_stock,
        "capacite_max": capacite_max,
        "camions_entrants": camions_en_cours,
        "camions_en_attente": camions_en_attente,
        "alertes": alertes
    }

@app.post("/predict", response_model=schemas.PredictionRecordOut)
def predict(data: PredictionInput, db: Session = Depends(get_db)):
    """Prédit le temps d'attente et sauvegarde le résultat en base"""
    input_df = pd.DataFrame([{
        "heure": data.heure,
        "jour_semaine": data.jour_semaine,
        "camions_entrants": data.camions_entrants,
        "niveau_stock": data.niveau_stock,
        "temperature": data.temperature,
    }])
    prediction = model.predict(input_df)[0]
    resultat = round(float(prediction), 1)

    record = models.PredictionRecord(
        heure=data.heure,
        jour_semaine=data.jour_semaine,
        camions_entrants=data.camions_entrants,
        niveau_stock=data.niveau_stock,
        temperature=data.temperature,
        resultat=resultat
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.get("/predictions/history", response_model=list[schemas.PredictionRecordOut])
def get_predictions_history(db: Session = Depends(get_db)):
    """Retourne les 50 dernières prédictions, les plus récentes en premier"""
    return db.query(models.PredictionRecord).order_by(models.PredictionRecord.id.desc()).limit(50).all()
@app.get("/warehouse/history")
def get_warehouse_history():
    """Retourne un historique simulé du temps d'attente sur les dernières 12 heures"""
    heures = list(range(12))
    temps_attente = [round(random.uniform(5, 25), 1) for _ in heures]
    return {
        "heures": [f"{h}h" for h in heures],
        "temps_attente": temps_attente
    }
    
    
# ---------- CRUD CAMIONS ----------

@app.post("/trucks", response_model=schemas.TruckOut)
async def create_truck(truck: schemas.TruckCreate, db: Session = Depends(get_db)):
    db_truck = models.Truck(**truck.model_dump())
    db.add(db_truck)
    db.commit()
    db.refresh(db_truck)
    await manager.broadcast({"event": "truck_created", "plaque": db_truck.plaque})
    return db_truck

@app.get("/trucks", response_model=list[schemas.TruckOut])
def list_trucks(db: Session = Depends(get_db)):
    return db.query(models.Truck).all()

@app.get("/trucks/{truck_id}", response_model=schemas.TruckOut)
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camion non trouvé")
    return truck

@app.put("/trucks/{truck_id}", response_model=schemas.TruckOut)
async def update_truck(truck_id: int, truck_update: schemas.TruckUpdate, db: Session = Depends(get_db)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camion non trouvé")
    for key, value in truck_update.model_dump(exclude_unset=True).items():
        setattr(truck, key, value)
    db.commit()
    db.refresh(truck)
    await manager.broadcast({"event": "truck_updated", "plaque": truck.plaque})
    return truck

@app.delete("/trucks/{truck_id}")
async def delete_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Camion non trouvé")
    db.delete(truck)
    db.commit()
    await manager.broadcast({"event": "truck_deleted", "plaque": truck.plaque})
    return {"message": "Camion supprimé"}  
from fastapi.responses import StreamingResponse
from app.reports import generate_pdf_report, generate_excel_report



# ---------- EXPORT RAPPORTS ----------

@app.get("/reports/pdf")
def export_pdf(db: Session = Depends(get_db)):
    status = get_warehouse_status(db)
    trucks = db.query(models.Truck).all()
    predictions = db.query(models.PredictionRecord).order_by(models.PredictionRecord.id.desc()).all()
    buffer = generate_pdf_report(status, trucks, predictions)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rapport_smart_warehouse.pdf"}
    )


@app.get("/reports/excel")
def export_excel(db: Session = Depends(get_db)):
    status = get_warehouse_status(db)
    trucks = db.query(models.Truck).all()
    predictions = db.query(models.PredictionRecord).order_by(models.PredictionRecord.id.desc()).all()
    buffer = generate_excel_report(status, trucks, predictions)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=rapport_smart_warehouse.xlsx"}
    )


# ---------- WEBSOCKET TEMPS REEL ----------

from app.websocket_manager import manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from fastapi import WebSocket, WebSocketDisconnect

