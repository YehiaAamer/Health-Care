# backendfirst/api/services/notification_service.py
from ..models import Notification

def create_notification(user, type, title, body, related_object_id=None, related_object_type=None):
    """
    Creates and returns a Notification instance for a given user.
    """
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        body=body,
        related_object_id=related_object_id,
        related_object_type=related_object_type,
    )
