# api/train_cardio.py
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import os
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = Path(r"E:\Final-Project\Health-Care\Health-Care-main\backend\backendfirst\api\data\cardio_reduced_with_target.xlsx")
MODEL_PATH = BASE_DIR / 'resources' / 'cardio_model.pkl'
SCALER_PATH = BASE_DIR / 'resources' / 'cardio_scaler.pkl'

print(f"📂 Loading data from: {DATA_PATH}")
if not DATA_PATH.exists():
    raise FileNotFoundError(f"❌ Excel file not found at: {DATA_PATH}")

df = pd.read_excel(DATA_PATH)

# 1. Convert Age from days to years (Age = Years)
df['Age_years'] = df['Age'] / 365.25

# 2. Clean Blood Pressure Outliers
# Absolute values first to remove negative values
df['Systolic BP'] = df['Systolic BP'].abs()
df['Diastolic BP'] = df['Diastolic BP'].abs()

# Swap Systolic BP and Diastolic BP if they are swapped
swapped_idx = df['Systolic BP'] < df['Diastolic BP']
if swapped_idx.any():
    print(f"🔄 Swapping Systolic BP and Diastolic BP in {swapped_idx.sum()} rows where Systolic < Diastolic")
    df.loc[swapped_idx, ['Systolic BP', 'Diastolic BP']] = df.loc[swapped_idx, ['Diastolic BP', 'Systolic BP']].values

# Keep only clinically realistic values
# Systolic BP: 80 - 250
# Diastolic BP: 40 - 150
before_filter = len(df)
df_clean = df[
    (df['Systolic BP'] >= 80) & (df['Systolic BP'] <= 250) &
    (df['Diastolic BP'] >= 40) & (df['Diastolic BP'] <= 150)
].copy()
after_filter = len(df_clean)
print(f"🧹 Removed {before_filter - after_filter} invalid rows containing out-of-range BP values.")

# 3. Features and target (Consistent Order)
feature_cols = ['Age_years', 'Gender', 'Height', 'Weight', 'Systolic BP', 'Diastolic BP', 'Cholesterol', 'Glucose']
X = df_clean[feature_cols]
y = df_clean['Cardio']

# 4. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 5. Fit Scaler (on training data only)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 6. Train Logistic Regression
model = LogisticRegression(
    random_state=42,
    max_iter=1000,
    solver='lbfgs'
)
model.fit(X_train_scaled, y_train)

# 7. Evaluate Model
y_pred = model.predict(X_test_scaled)
y_prob = model.predict_proba(X_test_scaled)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)
conf_matrix = confusion_matrix(y_test, y_pred)

print("\n📊 Evaluation Metrics on Test Set:")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")
print(f"ROC-AUC:   {roc_auc:.4f}")
print("Confusion Matrix:")
print(conf_matrix)

print("\n📉 Feature Importance (Standardized Coefficients):")
for col, coef in zip(feature_cols, model.coef_[0]):
    print(f"  {col}: {coef:.4f}")
print(f"  Intercept: {model.intercept_[0]:.4f}")

# 8. Save Model and Scaler
print(f"\n💾 Saving model to: {MODEL_PATH}")
print(f"💾 Saving scaler to: {SCALER_PATH}")
os.makedirs(MODEL_PATH.parent, exist_ok=True)
joblib.dump(model, str(MODEL_PATH))
joblib.dump(scaler, str(SCALER_PATH))

print("✅ Model trained and saved successfully!")
