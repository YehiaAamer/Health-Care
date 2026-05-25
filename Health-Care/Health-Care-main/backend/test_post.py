import requests

url = 'http://127.0.0.1:8000/api/predict/'
payload = {
    'pregnancies': 0,
    'glucose': 85,
    'bloodPressure': 70,
    'skinThickness': 20,
    'insulin': 0,
    'bmi': 25,
    'diabetesPedigreeFunction': 0.5,
    'age': 35
}

try:
    r = requests.post(url, json=payload, timeout=5)
    print('STATUS', r.status_code)
    print('BODY', r.text)
except Exception as e:
    print('ERR', e)
