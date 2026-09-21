import pandas as pd
import numpy as np

np.random.seed(42)

n_samples = 500

data = {
    "heure": np.random.randint(0, 24, n_samples),
    "jour_semaine": np.random.randint(0, 7, n_samples),
    "camions_entrants": np.random.randint(1, 20, n_samples),
    "niveau_stock": np.random.randint(100, 5000, n_samples),
    "temperature": np.round(np.random.uniform(15, 35, n_samples), 1),
}

df = pd.DataFrame(data)

# Temps d'attente simulé : dépend du nombre de camions + un peu de bruit aléatoire
df["temps_attente_min"] = (
    df["camions_entrants"] * 2.5
    + np.random.normal(0, 5, n_samples)
).clip(lower=0).round(1)

df.to_csv("app/data/warehouse_data.csv", index=False)
print(f"Dataset généré : {len(df)} lignes dans app/data/warehouse_data.csv")