# api/train_model.py
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import os
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
import joblib

# تحديد المسارات بشكل dynamic (يعمل على أي جهاز)
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / 'data' / 'pima.csv'
MODEL_PATH = BASE_DIR / 'diabetes_model.pkl'
SCALER_PATH = BASE_DIR / 'scaler.pkl'

# 1. اقرأ الداتا
print(f"📂 Loading data from: {DATA_PATH}")
if not DATA_PATH.exists():
    raise FileNotFoundError(f"❌ الملف غير موجود: {DATA_PATH}")

data = pd.read_csv(DATA_PATH, header=None)
# أسماء الأعمدة (الداتا سيت بدون هيدر)
columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 
           'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
data.columns = columns

# 2. معالجة القيم الصفر الغلط (مثلاً Glucose=0 مش منطقي)
cols_to_fix = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
for col in cols_to_fix:
    data[col] = data[col].replace(0, np.nan)
    data[col] = data[col].fillna(data[col].median())

# 3. فصل الـ features والـ target
X = data.drop('Outcome', axis=1)
y = data['Outcome']

# 4. تقسيم البيانات
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 5. Scaling (مهم لـ XGBoost)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# 6. تدريب XGBoost
model = XGBClassifier(
    objective='binary:logistic',
    eval_metric='logloss',
    use_label_encoder=False,
    random_state=42,
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1
)

model.fit(X_train, y_train)

# 7. حفظ الموديل + الـ scaler
print(f"💾 Saving model to: {MODEL_PATH}")
joblib.dump(model, str(MODEL_PATH))
joblib.dump(scaler, str(SCALER_PATH))

print("✅ Model trained and saved successfully!")
print(f"📊 دقة الموديل على الـ test: {model.score(X_test, y_test):.4f}")