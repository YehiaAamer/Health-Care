# api/auth.py - Authentication Views

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.urls import reverse
from ..models import UserProfile
import cloudinary.uploader
import cloudinary
import re
import os

# ═══════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════

def get_picture_url(profile) -> str | None:
    """Return the full Cloudinary URL for a profile picture, or None."""
    if not profile or not profile.profile_picture:
        return None
    value = profile.profile_picture
    # CloudinaryResource has a .url property; plain strings need cloudinary_url()
    if hasattr(value, 'url'):
        return value.url
    public_id = str(value)
    url, _ = cloudinary.utils.cloudinary_url(public_id)
    return url or None


def validate_email(email):
    """تحقق من صحة البريد الإلكتروني"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

def validate_password(password):
    """تحقق من قوة كلمة المرور"""
    if len(password) < 8:
        return False, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
    if not re.search(r'[A-Z]', password):
        return False, "كلمة المرور يجب أن تحتوي على حرف كبير"
    if not re.search(r'[a-z]', password):
        return False, "كلمة المرور يجب أن تحتوي على حرف صغير"
    if not re.search(r'[0-9]', password):
        return False, "كلمة المرور يجب أن تحتوي على رقم"
    return True, "كلمة المرور قوية"

def get_tokens_for_user(user):
    """إرجاع access و refresh tokens للمستخدم"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# ═══════════════════════════════════════════════════════════════
# Registration (Sign Up)
# ═══════════════════════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    تسجيل مستخدم جديد
    
    POST /api/auth/register/
    {
        "email": "user@example.com",
        "password": "SecurePassword123",
        "first_name": "أحمد",
        "last_name": "محمد"
    }
    """
    try:
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        role = request.data.get('role', UserProfile.ROLE_PATIENT).strip().lower()

        # ─────────────────────────────────────────────
        # 1. التحقق من البيانات المطلوبة
        # ─────────────────────────────────────────────
        if not email or not password:
            return Response(
                {"error": "البريد الإلكتروني وكلمة المرور مطلوبان"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────────────
        # 2. التحقق من صيغة البريد الإلكتروني
        # ─────────────────────────────────────────────
        if not validate_email(email):
            return Response(
                {"error": "صيغة البريد الإلكتروني غير صحيحة"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────────────
        # 3. التحقق من قوة كلمة المرور
        # ─────────────────────────────────────────────
        is_valid, message = validate_password(password)
        if not is_valid:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────────────
        # 4. التحقق من أن البريد ما وُجد قبل كده
        # ─────────────────────────────────────────────
        if User.objects.filter(username=email).exists():
            return Response(
                {"error": "هذا البريد الإلكتروني مسجل بالفعل"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────────────
        # 5. إنشاء المستخدم الجديد
        # ─────────────────────────────────────────────
        from django.utils import timezone
        user = User(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            last_login=timezone.now()
        )
        user.set_password(password)
        user.save()

        # ─────────────────────────────────────────────
        # 6. تحديث البروفايل بالدور المطلوب وإرجاع الـ tokens
        # ─────────────────────────────────────────────
        tokens = get_tokens_for_user(user)
        
        # جلب البروفايل الذي تم إنشاؤه بواسطة الـ signal
        profile = UserProfile.objects.get(user=user)
        if role in [UserProfile.ROLE_PATIENT, UserProfile.ROLE_DOCTOR]:
            profile.role = role
            if role == UserProfile.ROLE_DOCTOR:
                profile.doctor_status = UserProfile.DOCTOR_APPROVED
            profile.save()

        return Response({
            "message": "تم إنشاء الحساب بنجاح",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": get_picture_url(profile),
                "bio": profile.bio if profile and profile.bio else None,
                "phone": profile.phone if profile and profile.phone else None,
                "role": profile.role if profile else UserProfile.ROLE_PATIENT,
                "doctor_status": profile.doctor_status if profile else None,
            },
            "tokens": tokens
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ═══════════════════════════════════════════════════════════════
# Login
# ═══════════════════════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    print(f"Login request data: {request.data}")
    """
    تسجيل الدخول
    
    POST /api/auth/login/
    {
        "email": "user@example.com",
        "password": "SecurePassword123"
    }
    """
    try:
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '').strip()


        if not email or not password:
            return Response(
                {"error": "البريد الإلكتروني وكلمة المرور مطلوبان"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # محاولة المصادقة
        from django.contrib.auth.models import User as AuthUser
        try:
            db_user = AuthUser.objects.get(username=email)
        except AuthUser.DoesNotExist:
            print(f"[DEBUG] No user found with username='{email}'")

        user = authenticate(username=email, password=password)

        if not user:
            print(f"Login failed for email: {email} and password: {password}")
            return Response(
                {"error": "البريد الإلكتروني أو كلمة المرور غير صحيحة"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # إرجاع الـ tokens
        tokens = get_tokens_for_user(user)
        profile = getattr(user, 'profile', None)

        return Response({
            "message": "تم تسجيل الدخول بنجاح",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "profile_picture": get_picture_url(profile),
                "bio": profile.bio if profile and profile.bio else None,
                "phone": profile.phone if profile and profile.phone else None,
                "role": profile.role if profile else UserProfile.ROLE_PATIENT,
                "doctor_status": profile.doctor_status if profile else None,
            },
            "tokens": tokens
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ═══════════════════════════════════════════════════════════════
# Get Current User
# ═══════════════════════════════════════════════════════════════
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """الحصول على بيانات المستخدم الحالي"""
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "profile_picture": get_picture_url(profile),
        "bio": profile.bio if profile and profile.bio else None,
        "phone": profile.phone if profile and profile.phone else None,
        "role": profile.role if profile else UserProfile.ROLE_PATIENT,
        "doctor_status": profile.doctor_status if profile else None,
    })


# ═══════════════════════════════════════════════════════════════
# Update Profile
# ═══════════════════════════════════════════════════════════════
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def update_profile(request):
    """
    تحديث بيانات المستخدم

    PUT /api/profile/
    {
        "first_name": "أحمد",
        "last_name": "محمد",
        "email": "ahmed@example.com"
    }

    FormData (للصورة):
    - profile_picture: file
    """
    try:
        import logging
        logger = logging.getLogger(__name__)

        # Debug logging
        logger.info(f"[PROFILE UPDATE] Request method: {request.method}")
        logger.info(f"[PROFILE UPDATE] Request content type: {request.content_type}")
        logger.info(f"[PROFILE UPDATE] Request data: {request.data}")
        logger.info(f"[PROFILE UPDATE] User: {request.user.email if request.user else 'None'}")

        user = request.user
        if not user:
            return Response(
                {"error": "المستخدم غير موجود"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        profile = getattr(user, 'profile', None)

        # تحديث الأسماء
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        email = request.data.get('email', '').strip().lower()

        logger.info(f"[PROFILE UPDATE] first_name: {first_name}, last_name: {last_name}, email: {email}")

        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if email and email != user.email:
            # التحقق من عدم تكرار البريد
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({
                    "error": "البريد الإلكتروني مستخدم بالفعل"
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

        # تحديث بيانات البروفايل الإضافية
        if profile:
            bio = request.data.get('bio', '').strip()
            phone = request.data.get('phone', '').strip()

            if bio:
                profile.bio = bio
            if phone:
                profile.phone = phone

        # معالجة الصورة الشخصية
        if 'profile_picture' in request.FILES:
            profile_picture = request.FILES['profile_picture']

            logger.debug(f"Profile picture received: {profile_picture.name}")
            logger.debug(f"Content type: {profile_picture.content_type}")
            logger.debug(f"Size: {profile_picture.size} bytes")

            # التحقق من نوع الملف
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if profile_picture.content_type not in allowed_types:
                return Response({
                    "error": "يرجى رفع صورة بصيغة JPG, PNG, GIF, أو WebP"
                }, status=status.HTTP_400_BAD_REQUEST)

            # التحقق من حجم الملف (5MB كحد أقصى)
            max_size = 5 * 1024 * 1024  # 5MB
            if profile_picture.size > max_size:
                return Response({
                    "error": "حجم الصورة يجب أن يكون أقل من 5MB"
                }, status=status.HTTP_400_BAD_REQUEST)

            # إنشاء البروفايل إذا لم يكن موجوداً
            if not profile:
                profile = UserProfile.objects.create(user=user)

            # حذف الصورة القديمة من Cloudinary إذا وجدت
            if profile.profile_picture:
                try:
                    old_public_id = str(profile.profile_picture)
                    cloudinary.uploader.destroy(old_public_id)
                except Exception as e:
                    logger.warning(f"[PROFILE UPDATE] Could not delete old Cloudinary image: {e}")

            # رفع الصورة الجديدة إلى Cloudinary
            upload_result = cloudinary.uploader.upload(
                profile_picture,
                public_id=f"user_{user.id}",
                folder='profile_pictures',
                overwrite=True,
                resource_type='image',
                transformation=[{'width': 500, 'height': 500, 'crop': 'fill', 'gravity': 'face', 'quality': 'auto'}],
            )
            profile.profile_picture = upload_result['public_id']
            profile.save()

        user.save()

        logger.info(f"[PROFILE UPDATE] Success - User updated: {user.email}")

        return Response({
            "message": "تم تحديث الملف الشخصي بنجاح",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "profile_picture": get_picture_url(profile),
                "bio": profile.bio if profile and profile.bio else None,
                "phone": profile.phone if profile and profile.phone else None,
                "role": profile.role if profile else UserProfile.ROLE_PATIENT,
                "doctor_status": profile.doctor_status if profile else None,
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        logger.error(f"[PROFILE UPDATE] Error: {str(e)}")
        logger.error(f"[PROFILE UPDATE] Traceback: {traceback.format_exc()}")
        return Response({
            "error": f"حدث خطأ: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══════════════════════════════════════════════════════════════
# Delete Profile Picture
# ═══════════════════════════════════════════════════════════════
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture(request):
    """حذف الصورة الشخصية للمستخدم"""
    try:
        user = request.user
        profile = getattr(user, 'profile', None)

        if not profile or not profile.profile_picture:
            return Response(
                {"error": "لا توجد صورة شخصية للحذف"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # حذف الصورة من Cloudinary
        public_id = str(profile.profile_picture)
        cloudinary.uploader.destroy(public_id)

        # مسح الحقل في قاعدة البيانات
        profile.profile_picture = None
        profile.save()

        return Response(
            {"message": "تم حذف الصورة الشخصية بنجاح"},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ═══════════════════════════════════════════════════════════════
# Original Logout (Refresh Token Blacklist)
# ═══════════════════════════════════════════════════════════════
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def logout(request):
#     """تسجيل الخروج"""
#     try:
#         refresh_token = request.data.get('refresh')
#         if not refresh_token:
#             return Response(
#                 {"error": "refresh token مطلوب"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         token = RefreshToken(refresh_token)
#         token.blacklist()

#         return Response(
#             {"message": "تم تسجيل الخروج بنجاح"},
#             status=status.HTTP_200_OK
#         )
#     except Exception as e:
#         return Response(
#             {"error": str(e)},
#             status=status.HTTP_400_BAD_REQUEST
#         )


# ═══════════════════════════════════════════════════════════════
# Password Reset Request
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    طلب إعادة تعيين كلمة المرور
    
    POST /api/auth/password-reset/
    {"email": "user@example.com"}
    """
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {"error": "البريد الإلكتروني مطلوب"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # البحث عن المستخدم
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # لأمن أفضل، نرجع نفس الرسالة حتى لو الإيميل مش موجود
            return Response({
                "message": "إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة التعيين"
            })
        
        # إنشاء token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # بناء الرابط
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"
        
        # محتوى الإيميل
        subject = "إعادة تعيين كلمة المرور - HealthCare"
        
        message = f"""
مرحباً {user.first_name or user.email}،

لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.

اضغط على الرابط التالي لإعادة تعيين كلمة المرور:
{reset_link}

هذا الرابط صالح لمدة 15 دقيقة.

إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.

مع التحية،
فريق HealthCare
        """
        
        # إرسال الإيميل
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({
            "message": "إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة التعيين"
        })
        
    except Exception as e:
        print(f"Password reset error: {str(e)}")
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ═══════════════════════════════════════════════════════════════
# Password Reset Confirm
# ═══════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    تأكيد إعادة تعيين كلمة المرور
    
    POST /api/auth/password-reset/confirm/
    {
        "uid": "encoded_uid",
        "token": "token",
        "new_password": "NewPassword123!"
    }
    """
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password', '').strip()
        
        if not uid or not token or not new_password:
            return Response(
                {"error": "جميع الحقول مطلوبة"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # التحقق من صحة كلمة المرور
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # فك تشفير UID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "رابط غير صالح"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # التحقق من الـ token
        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "الرابط منتهي الصلاحية أو غير صالح"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # تحديث كلمة المرور
        user.set_password(new_password)
        user.save()
        
        return Response({
            "message": "تم تغيير كلمة المرور بنجاح"
        })
        
    except Exception as e:
        print(f"Password reset confirm error: {str(e)}")
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
#################################################################################################################

# ═══════════════════════════════════════════════════════════════
# Backend - Logout API Endpoint by A.M
# ═══════════════════════════════════════════════════════════════
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    تسجيل الخروج - يقوم بإبطال الـ refresh token
    
    POST /api/auth/logout/
    {
        "refresh": "your-refresh-token"
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        
        print(f"[LOGOUT] Attempting logout for user: {request.user.email}")
        print(f"[LOGOUT] Refresh token received: {'Yes' if refresh_token else 'No'}")
        
        if not refresh_token:
            print("[LOGOUT] ❌ No refresh token provided")
            return Response(
                {"error": "refresh token مطلوب"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            token = RefreshToken(refresh_token)
            # Verify the token belongs to this user
            if token['user_id'] != request.user.id:
                print("[LOGOUT] ❌ Token user ID mismatch")
                return Response(
                    {"error": "token غير صالح"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token.blacklist()
            print(f"[LOGOUT] ✅ Successfully logged out user: {request.user.email}")
            
            return Response(
                {"message": "تم تسجيل الخروج بنجاح"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"[LOGOUT] ❌ Error blacklisting token: {str(e)}")
            # Even if blacklisting fails, we consider the user logged out on the frontend
            return Response(
                {"message": "تم تسجيل الخروج بنجاح", "warning": "فشل إبطال الـ token"},
                status=status.HTTP_200_OK
            )
            
    except Exception as e:
        print(f"[LOGOUT] ❌ Unexpected error: {str(e)}")
        return Response(
            {"error": f"حدث خطأ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
