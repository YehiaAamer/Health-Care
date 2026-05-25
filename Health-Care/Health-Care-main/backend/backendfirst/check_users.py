#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendfirst.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 50)
print("CHECKING DATABASE FOR USERS")
print("=" * 50)

users = User.objects.all()
print(f"\nTotal users in database: {users.count()}\n")

if users.exists():
    print("User List:")
    print("-" * 50)
    for user in users:
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  First Name: {user.first_name}")
        print(f"  Last Name: {user.last_name}")
        print(f"  Is Staff: {user.is_staff}")
        print(f"  Is Active: {user.is_active}")
        print(f"  Last Login: {user.last_login}")
        print(f"  Date Joined: {user.date_joined}")
        print("-" * 50)
else:
    print("No users found in the database.")
    print("\nTo create a test user, you can:")
    print("  1. Use the /api/auth/register/ endpoint")
    print("  2. Run: python manage.py createsuperuser")
    print("  3. Use a management command")
