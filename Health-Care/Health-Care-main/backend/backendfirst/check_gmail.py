import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import connection

test_emails = ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com"]

for email in test_emails:
    print(f"\n--- Testing Email: {email} ---")
    
    # Check User by username
    users_by_username = User.objects.filter(username=email)
    print(f"Query by username: {users_by_username.query}")
    print(f"Matching username count: {users_by_username.count()}")
    for u in users_by_username:
        print(f"  Found ID {u.id}: username='{u.username}', email='{u.email}'")

    # Check User by email
    users_by_email = User.objects.filter(email=email)
    print(f"Query by email: {users_by_email.query}")
    print(f"Matching email count: {users_by_email.count()}")
    for u in users_by_email:
        print(f"  Found ID {u.id}: username='{u.username}', email='{u.email}'")
