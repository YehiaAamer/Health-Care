import os
import django
import sys

# Set standard output encoding to UTF-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

email = 'yehiaaamer6@gmail.com'
password = 'Test1234!'

print("--- Testing django authenticate function ---")
user = authenticate(username=email, password=password)
print(f"Authenticated user: {user}")

if user is None:
    # Let's find the user and check their password manually
    try:
        u = User.objects.get(username=email)
        print(f"User exists: {u.username}")
        print(f"User is active: {u.is_active}")
        check_pass = u.check_password(password)
        print(f"Manual password check (check_password): {check_pass}")
    except User.DoesNotExist:
        print(f"User with username '{email}' does not exist in DB")
