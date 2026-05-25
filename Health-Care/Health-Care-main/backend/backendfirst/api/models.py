from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone



class UserProfile(models.Model):
    ROLE_PATIENT = "patient"
    ROLE_DOCTOR = "doctor"
    ROLE_ADMIN = "admin"
    ROLE_CHOICES = [
        (ROLE_PATIENT, "Patient"),
        (ROLE_DOCTOR, "Doctor"),
        (ROLE_ADMIN, "Admin"),
    ]

    DOCTOR_PENDING = "pending"
    DOCTOR_APPROVED = "approved"
    DOCTOR_REJECTED = "rejected"
    DOCTOR_SUSPENDED = "suspended"
    DOCTOR_STATUS_CHOICES = [
        (DOCTOR_PENDING, "Pending"),
        (DOCTOR_APPROVED, "Approved"),
        (DOCTOR_REJECTED, "Rejected"),
        (DOCTOR_SUSPENDED, "Suspended"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_PATIENT,
    )
    doctor_status = models.CharField(
        max_length=20,
        choices=DOCTOR_STATUS_CHOICES,
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profile"

    def __str__(self):
        return f"Profile: {self.user.username}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()


class DoctorPatientAssignment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACTIVE = "active"
    STATUS_REVOKED = "revoked"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_REVOKED, "Revoked"),
    ]

    doctor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_assignments",
    )
    patient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_assignments",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "doctor_patient_assignment"
        constraints = [
            models.UniqueConstraint(
                fields=["doctor_user", "patient_user"],
                name="uq_doctor_patient_assignment",
            )
        ]

    def __str__(self):
        return f"{self.doctor_user_id} -> {self.patient_user_id} ({self.status})"


class DoctorPatientChatThread(models.Model):
    assignment = models.OneToOneField(
        DoctorPatientAssignment,
        on_delete=models.CASCADE,
        related_name="chat_thread",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "doctor_patient_chat_thread"

    def __str__(self):
        return f"Thread #{self.id} for assignment #{self.assignment_id}"


class DoctorPatientChatMessage(models.Model):
    thread = models.ForeignKey(
        DoctorPatientChatThread,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_patient_messages",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "doctor_patient_chat_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"Message #{self.id} from {self.sender_user_id}"


class Prediction(models.Model):
    REVIEW_PENDING = "pending"
    REVIEW_APPROVED = "approved"
    REVIEW_REJECTED = "rejected"
    REVIEW_NEEDS_FOLLOWUP = "needs_followup"
    REVIEW_STATUS_CHOICES = [
        (REVIEW_PENDING, "Pending"),
        (REVIEW_APPROVED, "Approved"),
        (REVIEW_REJECTED, "Rejected"),
        (REVIEW_NEEDS_FOLLOWUP, "Needs follow-up"),
    ]

    patient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    assignment = models.ForeignKey(
        DoctorPatientAssignment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="predictions",
    )
    pregnancies = models.FloatField(default=0)
    glucose = models.FloatField(default=85.0)
    blood_pressure = models.FloatField(default=70.0)
    skin_thickness = models.FloatField(default=20.0)
    insulin = models.FloatField(default=0.0)
    bmi = models.FloatField(default=25.0)
    diabetes_pedigree_function = models.FloatField(default=0.5)
    age = models.PositiveIntegerField(default=35)
    probability = models.FloatField()
    risk_level = models.CharField(max_length=50)
    message = models.TextField(blank=True)
    review_status = models.CharField(
        max_length=20,
        choices=REVIEW_STATUS_CHOICES,
        default=REVIEW_PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prediction"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Prediction #{self.id} - {self.probability:.2f}%"


class PredictionReview(models.Model):
    DECISION_APPROVED = "approved"
    DECISION_REJECTED = "rejected"
    DECISION_NEEDS_FOLLOWUP = "needs_followup"
    DECISION_CHOICES = [
        (DECISION_APPROVED, "Approved"),
        (DECISION_REJECTED, "Rejected"),
        (DECISION_NEEDS_FOLLOWUP, "Needs follow-up"),
    ]

    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    doctor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prediction_reviews",
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prediction_review"
        constraints = [
            models.UniqueConstraint(
                fields=["prediction", "doctor_user"],
                name="uq_prediction_review",
            )
        ]

    def __str__(self):
        return f"Review #{self.id} for prediction #{self.prediction_id}"


class Medication(models.Model):
    name = models.CharField(max_length=255, unique=True)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "medication"

    def __str__(self):
        return self.name


class MedicationRecommendation(models.Model):
    TIMING_BEFORE_MEAL = "before_meal"
    TIMING_WITH_MEAL = "with_meal"
    TIMING_AFTER_MEAL = "after_meal"
    TIMING_UNSPECIFIED = "unspecified"
    TIMING_CHOICES = [
        (TIMING_BEFORE_MEAL, "Before meal"),
        (TIMING_WITH_MEAL, "With meal"),
        (TIMING_AFTER_MEAL, "After meal"),
        (TIMING_UNSPECIFIED, "Unspecified"),
    ]

    review = models.ForeignKey(
        PredictionReview,
        on_delete=models.CASCADE,
        related_name="medication_recommendations",
    )
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )
    dosage = models.CharField(max_length=100, blank=True, null=True)
    frequency_per_day = models.PositiveSmallIntegerField()
    timing = models.CharField(
        max_length=20,
        choices=TIMING_CHOICES,
        default=TIMING_UNSPECIFIED,
    )
    duration_days = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "medication_recommendation"

    def __str__(self):
        return f"{self.medication.name} for review #{self.review_id}"


class ChatbotSession(models.Model):
    patient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chatbot_sessions",
    )
    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chatbot_sessions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chatbot_session"

    def __str__(self):
        return f"Chatbot session #{self.id}"


class ChatbotMessage(models.Model):
    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_ASSISTANT, "Assistant"),
    ]

    session = models.ForeignKey(
        ChatbotSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chatbot_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role} message #{self.id}"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, null=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=100, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Appointment(models.Model):
    STATUS_SCHEDULED = "scheduled"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_NO_SHOW = "no_show"
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_NO_SHOW, "No Show"),
    ]

    TYPE_INITIAL = "initial"
    TYPE_FOLLOW_UP = "follow_up"
    TYPE_REVIEW = "review"
    TYPE_CHOICES = [
        (TYPE_INITIAL, "Initial Consultation"),
        (TYPE_FOLLOW_UP, "Follow-up"),
        (TYPE_REVIEW, "Prediction Review"),
    ]

    doctor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_appointments",
    )
    patient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_appointments",
    )
    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_SCHEDULED,
    )
    appointment_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_FOLLOW_UP,
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "appointment"
        ordering = ["appointment_date", "appointment_time"]

    def __str__(self):
        return f"Appointment #{self.id} - {self.appointment_date} {self.appointment_time}"
