import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile, Prediction

print(f"Total Users: {User.objects.count()}")
print(f"Total Patients: {UserProfile.objects.filter(role='patient').count()}")
print(f"Total Predictions: {Prediction.objects.count()}")
