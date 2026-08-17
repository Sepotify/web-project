from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from accounts.models import (
    ArtistProfile,
    Gender,
    PasswordResetToken,
    User,
    UserFollow,
    UserSettings,
)
from accounts.services import (
    create_artist_application,
    create_listener,
    create_password_reset_token,
)
from notifications.services import notify_staff_artist_verification
from subscriptions.services import can_upload_avatar, get_user_tier

PREF_KEY_TO_FIELD = {
    "subscription_expiring": "notify_subscription_expiring",
    "new_release": "notify_new_release",
    "artist_approval": "notify_artist_approval",
    "artist_rejection": "notify_artist_rejection",
    "monthly_earnings": "notify_monthly_earnings",
    "new_ticket": "notify_new_ticket",
    "artist_verification_request": "notify_artist_verification_request",
}


class RegisterListenerSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=2, max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    birth_date = serializers.DateField()
    gender = serializers.ChoiceField(choices=Gender.choices)
    accepted_privacy_policy = serializers.BooleanField()

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_accepted_privacy_policy(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the privacy policy.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        validated_data.pop("accepted_privacy_policy")
        return create_listener(**validated_data)


class RegisterArtistSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    stage_name = serializers.CharField(min_length=2, max_length=120)
    portfolio = serializers.CharField(min_length=10)
    accepted_privacy_policy = serializers.BooleanField()

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_accepted_privacy_policy(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the privacy policy.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        validated_data.pop("accepted_privacy_policy")
        user, artist = create_artist_application(**validated_data)
        notify_staff_artist_verification(artist)
        return {"user": user, "artist": artist}


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid email or password.") from exc
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()

    def create_token(self):
        email = self.validated_data["email"]
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        return create_password_reset_token(user)


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"])
        try:
            reset = PasswordResetToken.objects.select_related("user").get(token=attrs["token"])
        except PasswordResetToken.DoesNotExist as exc:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."}) from exc
        if not reset.is_valid:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})
        attrs["reset"] = reset
        return attrs

    def save(self, **kwargs):
        reset: PasswordResetToken = self.validated_data["reset"]
        user = reset.user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        reset.used_at = timezone.now()
        reset.save(update_fields=["used_at"])
        return user


class ArtistProfileSerializer(serializers.ModelSerializer):
    follower_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ArtistProfile
        fields = [
            "id",
            "user_id",
            "email",
            "stage_name",
            "bio",
            "portfolio",
            "status",
            "rejection_reason",
            "is_verified",
            "total_listeners",
            "total_streams",
            "follower_count",
            "is_following",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(follower=request.user).exists()


class UserPublicSerializer(serializers.ModelSerializer):
    subscription = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    artist_profile = ArtistProfileSerializer(read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "username",
            "role",
            "subscription",
            "avatar_url",
            "birth_date",
            "gender",
            "daily_stream_count",
            "follower_count",
            "following_count",
            "artist_profile",
            "is_following",
            "date_joined",
        ]

    def get_subscription(self, obj):
        return get_user_tier(obj)

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if not obj.avatar:
            return None
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following_users.count() + obj.following_artists.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.pk == obj.pk:
            return False
        return UserFollow.objects.filter(follower=request.user, following=obj).exists()


class UserMeSerializer(UserPublicSerializer):
    can_upload_avatar = serializers.SerializerMethodField()

    class Meta(UserPublicSerializer.Meta):
        fields = list(UserPublicSerializer.Meta.fields) + ["can_upload_avatar"]

    def get_can_upload_avatar(self, obj):
        return can_upload_avatar(obj)


class UserMeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["display_name", "birth_date", "gender", "avatar"]

    def validate_avatar(self, value):
        user = self.instance
        if value and not can_upload_avatar(user):
            raise serializers.ValidationError(
                "Basic plan users cannot upload or change their profile photo."
            )
        return value

    def validate_display_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Display name must be at least 2 characters.")
        return value.strip()


class RejectArtistSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=3, max_length=1000)


class UserSettingsSerializer(serializers.ModelSerializer):
    notification_preferences = serializers.DictField(
        child=serializers.BooleanField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = UserSettings
        fields = [
            "language",
            "default_volume",
            "notification_preferences",
            "notify_subscription_expiring",
            "notify_new_release",
            "notify_artist_approval",
            "notify_artist_rejection",
            "notify_monthly_earnings",
            "notify_new_ticket",
            "notify_artist_verification_request",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "notify_subscription_expiring": {"required": False, "write_only": True},
            "notify_new_release": {"required": False, "write_only": True},
            "notify_artist_approval": {"required": False, "write_only": True},
            "notify_artist_rejection": {"required": False, "write_only": True},
            "notify_monthly_earnings": {"required": False, "write_only": True},
            "notify_new_ticket": {"required": False, "write_only": True},
            "notify_artist_verification_request": {"required": False, "write_only": True},
        }

    def to_representation(self, instance):
        return {
            "language": instance.language,
            "default_volume": instance.default_volume,
            "notification_preferences": {
                "subscription_expiring": instance.notify_subscription_expiring,
                "new_release": instance.notify_new_release,
                "artist_approval": instance.notify_artist_approval,
                "artist_rejection": instance.notify_artist_rejection,
                "monthly_earnings": instance.notify_monthly_earnings,
                "new_ticket": instance.notify_new_ticket,
                "artist_verification_request": instance.notify_artist_verification_request,
            },
            "updated_at": instance.updated_at,
        }

    def validate_default_volume(self, value):
        if not (0.0 <= float(value) <= 1.0):
            raise serializers.ValidationError("Volume must be between 0 and 1.")
        return value

    def update(self, instance, validated_data):
        prefs = validated_data.pop("notification_preferences", None)
        if prefs:
            for key, field in PREF_KEY_TO_FIELD.items():
                if key in prefs:
                    validated_data[field] = prefs[key]
        return super().update(instance, validated_data)
