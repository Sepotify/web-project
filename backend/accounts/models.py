from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    LISTENER = "listener", "Listener"
    ARTIST = "artist", "Artist"
    SUPPORT = "support", "Support"
    ADMIN = "admin", "Admin"


class Gender(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    OTHER = "other", "Other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"


class ArtistStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("display_name", "System Admin")
        if "username" not in extra_fields:
            extra_fields["username"] = "system_admin"
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    username = models.SlugField(max_length=50, unique=True)
    display_name = models.CharField(max_length=120)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.LISTENER,
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(
        max_length=30,
        choices=Gender.choices,
        blank=True,
        null=True,
    )
    daily_stream_count = models.PositiveIntegerField(default=0)
    daily_stream_reset_date = models.DateField(default=timezone.localdate)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "display_name"]

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.display_name} <{self.email}>"

    def clean(self):
        super().clean()
        if self.role == UserRole.ADMIN:
            qs = User.objects.filter(role=UserRole.ADMIN)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({"role": "Only one admin is allowed in the system."})

    def save(self, *args, **kwargs):
        if self.role == UserRole.ADMIN:
            self.is_staff = True
            self.is_superuser = True
            qs = User.objects.filter(role=UserRole.ADMIN)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Only one admin is allowed in the system.")
        return super().save(*args, **kwargs)

    @property
    def subscription_tier(self):
        from subscriptions.services import get_user_tier

        return get_user_tier(self)


class ArtistProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="artist_profile",
    )
    stage_name = models.CharField(max_length=120)
    bio = models.TextField(blank=True, default="")
    portfolio = models.TextField(help_text="Sample works / portfolio description or URLs")
    status = models.CharField(
        max_length=20,
        choices=ArtistStatus.choices,
        default=ArtistStatus.PENDING,
    )
    rejection_reason = models.TextField(blank=True, default="")
    is_verified = models.BooleanField(default=False)
    total_listeners = models.PositiveIntegerField(default=0)
    total_streams = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.stage_name} ({self.status})"


class UserFollow(models.Model):
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following_users",
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="unique_user_follow",
            ),
            models.CheckConstraint(
                condition=~models.Q(follower=models.F("following")),
                name="prevent_self_follow",
            ),
        ]

    def __str__(self):
        return f"{self.follower_id} → {self.following_id}"


class ArtistFollow(models.Model):
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following_artists",
    )
    artist = models.ForeignKey(
        ArtistProfile,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "artist"],
                name="unique_artist_follow",
            ),
        ]

    def __str__(self):
        return f"{self.follower_id} → artist:{self.artist_id}"


class UserSettings(models.Model):
    class Language(models.TextChoices):
        FA = "fa", "Persian"
        EN = "en", "English"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.EN,
    )
    default_volume = models.FloatField(default=0.7)
    # Notification preference flags (synced across devices)
    notify_subscription_expiring = models.BooleanField(default=True)
    notify_new_release = models.BooleanField(default=True)
    notify_artist_approval = models.BooleanField(default=True)
    notify_artist_rejection = models.BooleanField(default=True)
    notify_monthly_earnings = models.BooleanField(default=True)
    notify_new_ticket = models.BooleanField(default=True)
    notify_artist_verification_request = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings<{self.user_id}>"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_valid(self):
        return self.used_at is None and timezone.now() < self.expires_at

    def __str__(self):
        return f"ResetToken<{self.user_id}>"
