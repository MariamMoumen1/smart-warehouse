import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# Charger les données générées à l'étape précédente
df = pd.read_csv("app/data/warehouse_data.csv")

# Features (X) = les colonnes qu'on utilise pour prédire
# Target (y) = ce qu'on veut prédire (le temps d'attente)
X = df[["heure", "jour_semaine", "camions_entrants", "niveau_stock", "temperature"]]
y = df["temps_attente_min"]

# Séparer en données d'entraînement (80%) et de test (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Créer et entraîner le modèle
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Évaluer la précision du modèle
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"Erreur moyenne (MAE) : {mae:.2f} minutes")

# Sauvegarder le modèle entraîné dans un fichier
joblib.dump(model, "app/ml/model.pkl")
print("Modèle sauvegardé dans app/ml/model.pkl")