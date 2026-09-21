from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    plaque = Column(String, unique=True, index=True)
    statut = Column(String, default="en_attente")  # en_attente, en_cours, termine
    temps_attente_min = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WarehouseLog(Base):
    __tablename__ = "warehouse_logs"

    id = Column(Integer, primary_key=True, index=True)
    niveau_stock = Column(Integer)
    camions_entrants = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    heure = Column(Integer)
    jour_semaine = Column(Integer)
    camions_entrants = Column(Integer)
    niveau_stock = Column(Integer)
    temperature = Column(Float)
    resultat = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    