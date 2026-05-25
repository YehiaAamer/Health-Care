# api/doctor_permissions.py - Doctor-specific permission classes
from rest_framework.permissions import BasePermission


class IsApprovedDoctor(BasePermission):
    """
    Only allows access to users with role='doctor' and doctor_status='approved'.
    """
    message = "يجب أن تكون طبيباً معتمداً للوصول إلى هذه الصفحة."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)
        if not profile:
            return False

        return (
            profile.role == "doctor"
            and profile.doctor_status == "approved"
        )


class IsDoctorOrAdmin(BasePermission):
    """
    Allows access to approved doctors or admin/staff users.
    """
    message = "يجب أن تكون طبيباً أو مديراً للوصول إلى هذه الصفحة."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)
        if not profile:
            return False

        return (
            profile.role == "doctor"
            and profile.doctor_status == "approved"
        )
