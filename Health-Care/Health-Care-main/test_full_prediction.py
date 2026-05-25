import sys, json
sys.path.insert(0, 'backend')
from backendfirst.api.medgamma_client import predict_via_medgamma

test_cases = [
    {"name": "Medium Risk", "data": {"pregnancies": 2, "glucose": 150, "blood_pressure": 80, "skin_thickness": 25, "insulin": 100, "bmi": 30.5, "diabetes_pedigree_function": 0.5, "age": 45}},
    {"name": "Low Risk", "data": {"pregnancies": 1, "glucose": 85, "blood_pressure": 70, "skin_thickness": 20, "insulin": 50, "bmi": 22, "diabetes_pedigree_function": 0.3, "age": 25}},
    {"name": "High Risk", "data": {"pregnancies": 5, "glucose": 180, "blood_pressure": 90, "skin_thickness": 35, "insulin": 150, "bmi": 35, "diabetes_pedigree_function": 0.8, "age": 55}},
]

results = []
for case in test_cases:
    print(f"Testing: {case['name']}...")
    result = predict_via_medgamma(case['data'])
    results.append({"name": case['name'], "result": result})
    print(f"  Done: {result['probability']}% - {result['risk_level']}")

print("\n" + "=" * 50)
print("Summary:")
print("=" * 50)
for r in results:
    print(f"{r['name']}: {r['result']['probability']}% ({r['result']['risk_level']})")

# Save to file
with open('test_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\nResults saved to test_results.json")
