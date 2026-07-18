import re
import secrets
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import (
    ArtistFollow,
    ArtistProfile,
    ArtistStatus,
    PasswordResetToken,
    User,
    UserFollow,
    UserRole,
    UserSettings,
)
from subscriptions.models import Subscription, SubscriptionTier


def generate_username(base_name: str) -> str:
    base = slugify(base_name).replace("-", "_")[:24] or "user"
    if not re.match(r"^[a-z0-9_]+$", base):
        base = "user"

    candidate = base
    suffix = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{base}_{suffix}"
        suffix += 1
    return candidate


@transaction.atomic
def create_listener(*, email, password, display_name, birth_date, gender):
    user = User.objects.create_user(
        email=email.lower().strip(),
        password=password,
        display_name=display_name.strip(),
        username=generate_username(display_name),
        role=UserRole.LISTENER,
        birth_date=birth_date,
        gender=gender,
    )
    UserSettings.objects.create(user=user)
    Subscription.objects.create(
        user=user,
        tier=SubscriptionTier.BASIC,
        start_date=timezone.now(),
        is_active=True,
    )
    return user


@transaction.atomic
def create_artist_application(*, email, password, stage_name, portfolio):
    stage_name = stage_name.strip()
    user = User.objects.create_user(
        email=email.lower().strip(),
        password=password,
        display_name=stage_name,
        username=generate_username(stage_name),
        role=UserRole.ARTIST,
    )
    UserSettings.objects.create(user=user)
    Subscription.objects.create(
        user=user,
        tier=SubscriptionTier.BASIC,
        start_date=timezone.now(),
        is_active=True,
    )
    artist = ArtistProfile.objects.create(
        user=user,
        stage_name=stage_name,
        portfolio=portfolio.strip(),
        status=ArtistStatus.PENDING,
        is_verified=False,
    )
    return user, artist


def create_password_reset_token(user: User) -> PasswordResetToken:
    token = secrets.token_urlsafe(32)
    return PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=1),
    )


def follow_user(follower: User, target: User) -> tuple[bool, str]:
    if follower.pk == target.pk:
        return False, "You cannot follow yourself."
    _, created = UserFollow.objects.get_or_create(follower=follower, following=target)
    if not created:
        return False, "Already following this user."
    return True, "Followed."


def unfollow_user(follower: User, target: User) -> tuple[bool, str]:
    deleted, _ = UserFollow.objects.filter(follower=follower, following=target).delete()
    if not deleted:
        return False, "You are not following this user."
    return True, "Unfollowed."


def follow_artist(follower: User, artist: ArtistProfile) -> tuple[bool, str]:
    _, created = ArtistFollow.objects.get_or_create(follower=follower, artist=artist)
    if not created:
        return False, "Already following this artist."
    return True, "Followed."


def unfollow_artist(follower: User, artist: ArtistProfile) -> tuple[bool, str]:
    deleted, _ = ArtistFollow.objects.filter(follower=follower, artist=artist).delete()
    if not deleted:
        return False, "You are not following this artist."
    return True, "Unfollowed."


@transaction.atomic
def approve_artist(artist: ArtistProfile) -> ArtistProfile:
    artist.status = ArtistStatus.APPROVED
    artist.is_verified = True
    artist.rejection_reason = ""
    artist.save(update_fields=["status", "is_verified", "rejection_reason", "updated_at"])
    return artist


@transaction.atomic
def reject_artist(artist: ArtistProfile, reason: str) -> ArtistProfile:
    artist.status = ArtistStatus.REJECTED
    artist.is_verified = False
    artist.rejection_reason = reason.strip()
    artist.save(update_fields=["status", "is_verified", "rejection_reason", "updated_at"])
    return artist
