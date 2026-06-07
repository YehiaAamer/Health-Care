# backendfirst/api/views/notification_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Notification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_notifications(request):
    """
    GET /api/patient/notifications/
    Returns notifications for the authenticated patient.
    """
    notifications = (
        Notification.objects
        .filter(user=request.user)
        .order_by("-created_at")[:20]
    )

    data = [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "is_read": n.is_read,
        "related_object_id": n.related_object_id,
        "related_object_type": n.related_object_type,
        "created_at": n.created_at.isoformat(),
    } for n in notifications]

    return Response({"count": len(data), "notifications": data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    """
    POST /api/notifications/<id>/read/
    Marks a notification as read for the authenticated user (doctor or patient).
    """
    try:
        notification = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return Response(
            {"error": "الإشعار غير موجود" if request.LANGUAGE_CODE == 'ar' else "Notification not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Validate ownership
    if notification.user != request.user:
        return Response(
            {"error": "غير مصرح لك بتعديل هذا الإشعار" if request.LANGUAGE_CODE == 'ar' else "Not authorized"},
            status=status.HTTP_403_FORBIDDEN
        )

    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save(update_fields=["is_read", "read_at"])

    return Response({
        "success": True,
        "message": "تمت مراجعة الإشعار بنجاح" if request.LANGUAGE_CODE == 'ar' else "Notification marked as read successfully"
    })
