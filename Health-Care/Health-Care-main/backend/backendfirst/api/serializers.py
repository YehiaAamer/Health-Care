from rest_framework import serializers

class PredictionRequestSerializer(serializers.Serializer):
    # Shared / Basic
    gender = serializers.ChoiceField(choices=["male", "female"], default="male")
    age = serializers.IntegerField(min_value=0, max_value=120)
    
    # Diabetes specific
    pregnancies = serializers.IntegerField(min_value=0, default=0)
    glucose = serializers.FloatField(min_value=0)
    skin_thickness = serializers.FloatField(min_value=0, default=20)
    insulin = serializers.FloatField(min_value=0, default=0)
    diabetes_pedigree_function = serializers.FloatField(min_value=0, default=0.5)
    
    # Cardio specific & Shared physical
    systolic_blood_pressure = serializers.FloatField(min_value=0)
    diastolic_blood_pressure = serializers.FloatField(min_value=0)
    cholesterol = serializers.FloatField(min_value=0)
    weight = serializers.FloatField(min_value=1)
    height = serializers.FloatField(min_value=10) # cm
    
    # Optional lifestyle (from user prompt)
    smoke = serializers.BooleanField(default=False, required=False)
    alcohol = serializers.BooleanField(default=False, required=False)
    physical_activity = serializers.BooleanField(default=False, required=False)
