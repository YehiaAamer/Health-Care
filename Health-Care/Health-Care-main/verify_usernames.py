import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')
import django
django.setup()
from django.contrib.auth.models import User
usernames = list(User.objects.values_list('username', flat=True))
print('All usernames:', usernames)
print('Gmail usernames:', [u for u in usernames if u.endswith('@gmail.com')])
