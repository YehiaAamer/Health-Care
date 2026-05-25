import requests
print(requests.post('http://localhost:8000/api/predict/', json={'glucose':120,'age':50}).text)
