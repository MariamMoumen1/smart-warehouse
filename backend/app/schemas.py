from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TruckCreate(BaseModel):
    plaque: str
    statut: str = "en_attente"
    temps_attente_min: Optional[float] = None

class TruckUpdate(BaseModel):
    plaque: Optional[str] = None
    statut: Optional[str] = None
    temps_attente_min: Optional[float] = None

class TruckOut(BaseModel):
    id: int
    plaque: str
    statut: str
    temps_attente_min: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
        
class PredictionRecordOut(BaseModel):
    id: int
    heure: int
    jour_semaine: int
    camions_entrants: int
    niveau_stock: int
    temperature: float
    resultat: float
    created_at: datetime

    class Config:
        from_attributes = True        