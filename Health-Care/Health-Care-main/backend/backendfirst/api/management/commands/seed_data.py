import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    UserProfile, DoctorPatientAssignment, Prediction, 
    PredictionReview, Medication, MedicationRecommendation,
    DoctorPatientChatThread, DoctorPatientChatMessage, Notification, Appointment
)
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seed database with realistic healthcare data for a specific doctor'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email of the doctor to seed data for')
        parser.add_argument('--username', type=str, help='Username of the doctor to seed data for')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')

        if email:
            try:
                doctor_user = User.objects.get(email=email)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Doctor with email {email} not found.'))
                return
        elif username:
            try:
                doctor_user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Doctor with username {username} not found.'))
                return
        else:
            # Default to sarah.j@hospital.com or the first doctor found
            doctor_user = User.objects.filter(profile__role=UserProfile.ROLE_DOCTOR).first()
            if not doctor_user:
                self.stdout.write(self.style.ERROR('No doctor found in database. Please create one first.'))
                return

        self.stdout.write(f'Seeding data for doctor: {doctor_user.username} ({doctor_user.email})')

        # Ensure doctor profile is approved
        profile, _ = UserProfile.objects.get_or_create(user=doctor_user)
        profile.role = UserProfile.ROLE_DOCTOR
        profile.doctor_status = UserProfile.DOCTOR_APPROVED
        if not profile.phone: profile.phone = "+1 (555) 123-4567"
        if not profile.bio: profile.bio = "Senior Specialist in Endocrinology and Diabetes Management."
        profile.save()

        # 1. Create Patients (if they don't exist)
        patient_names = [
            ('John', 'Doe'), ('Jane', 'Smith'), ('Michael', 'Brown'), ('Emily', 'Davis'),
            ('Robert', 'Wilson'), ('Linda', 'Taylor'), ('William', 'Anderson'), ('Elizabeth', 'Thomas'),
            ('David', 'Jackson'), ('Susan', 'White'), ('Joseph', 'Harris'), ('Jessica', 'Martin'),
            ('Thomas', 'Thompson'), ('Sarah', 'Garcia'), ('Christopher', 'Martinez'), ('Karen', 'Robinson'),
            ('Matthew', 'Clark'), ('Nancy', 'Rodriguez'), ('Anthony', 'Lewis'), ('Donna', 'Lee')
        ]

        patients = []
        for i, (first, last) in enumerate(patient_names):
            p_username = f'patient_{first.lower()}_{i}'
            p_email = f'{first.lower()}.{last.lower()}@demo.com'
            p_user, p_created = User.objects.get_or_create(
                username=p_username,
                defaults={
                    'first_name': first, 
                    'last_name': last,
                    'email': p_email
                }
            )
            if p_created:
                p_user.set_password('password123')
                p_user.save()
            
            p_profile, _ = UserProfile.objects.get_or_create(user=p_user)
            p_profile.role = UserProfile.ROLE_PATIENT
            p_profile.save()
            patients.append(p_user)

        # 2. Create Assignments
        for patient in patients:
            DoctorPatientAssignment.objects.get_or_create(
                doctor_user=doctor_user,
                patient_user=patient,
                defaults={'status': 'active'}
            )

        # 3. Create Medications
        meds_list = ['Metformin', 'Insulin Glargine', 'Glyburide', 'Lispro', 'Januvia']
        medications = []
        for m_name in meds_list:
            med, _ = Medication.objects.get_or_create(name=m_name)
            medications.append(med)

        # 4. Create Predictions & Reviews
        for i, patient in enumerate(patients):
            assignment = DoctorPatientAssignment.objects.get(doctor_user=doctor_user, patient_user=patient)
            
            # Delete old predictions to avoid clutter if re-running
            # Prediction.objects.filter(patient_user=patient, assignment=assignment).delete()

            num_preds = random.randint(2, 5)
            for j in range(num_preds):
                days_ago = random.randint(0, 45)
                created_at = timezone.now() - timedelta(days=days_ago)
                
                glucose = random.randint(85, 280)
                bmi = random.uniform(20.0, 42.0)
                age = random.randint(22, 78)
                
                prob = (glucose / 280 * 55) + (bmi / 42 * 30) + (age / 78 * 15)
                prob = min(max(prob, 5), 99)
                
                if prob < 25: risk = 'Low'
                elif prob < 50: risk = 'Medium'
                elif prob < 75: risk = 'High'
                else: risk = 'Very High'

                # Some are pending, some reviewed
                rev_status = 'pending'
                if days_ago > 3: # Older ones are likely reviewed
                    rev_status = random.choice(['approved', 'rejected', 'needs_followup'])

                pred = Prediction.objects.create(
                    patient_user=patient,
                    assignment=assignment,
                    pregnancies=random.randint(0, 10),
                    glucose=glucose,
                    blood_pressure=random.randint(70, 140),
                    skin_thickness=random.randint(15, 50),
                    insulin=random.randint(0, 300),
                    bmi=bmi,
                    diabetes_pedigree_function=random.uniform(0.2, 2.5),
                    age=age,
                    probability=prob,
                    risk_level=risk,
                    message=f"Clinical analysis indicates a {risk} risk level.",
                    review_status=rev_status
                )
                Prediction.objects.filter(id=pred.id).update(created_at=created_at)

                if rev_status != 'pending':
                    PredictionReview.objects.get_or_create(
                        prediction=pred,
                        doctor_user=doctor_user,
                        defaults={
                            'decision': rev_status,
                            'notes': f"Reviewed case for {patient.first_name}. Recommended monitoring."
                        }
                    )

        # 5. Create Appointments (Today and Future)
        # First clear old ones for this doctor to make it clean
        # Appointment.objects.filter(doctor_user=doctor_user).delete()
        
        # Today's appointments
        for i in range(5):
            patient = random.choice(patients)
            Appointment.objects.create(
                doctor_user=doctor_user,
                patient_user=patient,
                appointment_date=timezone.now().date(),
                appointment_time=timezone.now().replace(hour=9+i, minute=0, second=0, microsecond=0).time(),
                appointment_type=random.choice(['FOLLOW_UP', 'CONSULTATION']),
                status='scheduled',
                notes="Patient check-up."
            )

        # Future appointments
        for i in range(10):
            patient = random.choice(patients)
            Appointment.objects.create(
                doctor_user=doctor_user,
                patient_user=patient,
                appointment_date=timezone.now().date() + timedelta(days=random.randint(1, 14)),
                appointment_time=timezone.now().time(),
                appointment_type=random.choice(['FOLLOW_UP', 'INITIAL_CONSULT']),
                status='scheduled'
            )

        # 6. Create Messages
        for patient in patients[:8]:
            assignment = DoctorPatientAssignment.objects.get(doctor_user=doctor_user, patient_user=patient)
            thread, _ = DoctorPatientChatThread.objects.get_or_create(assignment=assignment)
            
            # Add a few messages
            for k in range(3):
                # Patient message
                DoctorPatientChatMessage.objects.create(
                    thread=thread,
                    sender_user=patient,
                    content=f"Hello Doctor, I have a question about my latest reading.",
                    created_at=timezone.now() - timedelta(hours=random.randint(1, 24))
                )
                # Doctor reply
                DoctorPatientChatMessage.objects.create(
                    thread=thread,
                    sender_user=doctor_user,
                    content=f"I've seen your results. Let's discuss this in our next session.",
                    created_at=timezone.now() - timedelta(hours=random.randint(0, 12))
                )

        # 7. Create Notifications
        for i in range(10):
            Notification.objects.create(
                user=doctor_user,
                type=random.choice(['NEW_PREDICTION', 'NEW_MESSAGE', 'APPOINTMENT_REMINDER']),
                title=f"Notification {i+1}",
                body="You have a new update regarding your patients.",
                is_read=random.choice([True, False])
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded dynamic data for {doctor_user.username}!'))
