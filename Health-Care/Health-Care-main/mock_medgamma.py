"""A simple Flask server that mimics the medgamma prediction API for local testing."""
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict/', methods=['POST'])
def predict():
    data = request.get_json() or {}
    # return dummy probability based on glucose for example
    glucose = float(data.get('glucose', 0))
    prob = min(max((glucose - 70) * 0.5, 0), 100)
    result = {
        'probability': prob,
        'risk_level': 'مرتفع' if prob > 50 else 'منخفض',
        'message': f'قيمة تجريبية: {prob:.1f}%'
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
