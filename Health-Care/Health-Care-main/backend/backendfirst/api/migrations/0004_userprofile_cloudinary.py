# Generated migration: switch profile_picture from ImageField to CloudinaryField

import cloudinary.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_userprofile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='profile_picture',
            field=cloudinary.models.CloudinaryField(
                'profile_picture',
                blank=True,
                null=True,
            ),
        ),
    ]
