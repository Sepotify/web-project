"""
Central subscription capability helpers.

Person 2/3 should import from here, e.g.:
    from subscriptions.services import max_playlists, daily_stream_limit
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.utils import timezone

from subscriptions.models import Subscription, SubscriptionTier

if TYPE_CHECKING:
    from accounts.models import User

# Limits from project spec (table 1)
PLAYLIST_LIMITS: dict[str, int | None] = {
    SubscriptionTier.BASIC: 6,
    SubscriptionTier.SILVER: 100,
    SubscriptionTier.GOLD: None,  # unlimited
}

DAILY_STREAM_LIMITS: dict[str, int | None] = {
    SubscriptionTier.BASIC: 60,
    SubscriptionTier.SILVER: None,
    SubscriptionTier.GOLD: None,
}


def get_or_create_subscription(user: User) -> Subscription:
    sub, _ = Subscription.objects.get_or_create(
        user=user,
        defaults={
            "tier": SubscriptionTier.BASIC,
            "start_date": timezone.now(),
            "is_active": True,
        },
    )
    return sub


def get_user_tier(user: User) -> str:
    try:
        sub = Subscription.objects.get(user_id=user.pk)
    except Subscription.DoesNotExist:
        sub = get_or_create_subscription(user)

    if not sub.is_currently_active and sub.tier != SubscriptionTier.BASIC:
        # Expired paid plan falls back to basic capabilities
        return SubscriptionTier.BASIC
    return sub.tier


def can_upload_avatar(user: User) -> bool:
    return get_user_tier(user) != SubscriptionTier.BASIC


def max_playlists(user: User) -> int | None:
    """Return max playlist count, or None for unlimited."""
    return PLAYLIST_LIMITS.get(get_user_tier(user))


def daily_stream_limit(user: User) -> int | None:
    """Return daily stream cap, or None for unlimited."""
    return DAILY_STREAM_LIMITS.get(get_user_tier(user))


def can_see_stats(user: User) -> bool:
    return get_user_tier(user) == SubscriptionTier.GOLD


def can_early_access(user: User) -> bool:
    return get_user_tier(user) == SubscriptionTier.GOLD


def can_download(user: User) -> bool:
    return get_user_tier(user) in (SubscriptionTier.SILVER, SubscriptionTier.GOLD)


def reset_daily_streams_if_needed(user: User) -> User:
    today = timezone.localdate()
    if user.daily_stream_reset_date != today:
        user.daily_stream_count = 0
        user.daily_stream_reset_date = today
        user.save(update_fields=["daily_stream_count", "daily_stream_reset_date"])
    return user


def can_stream_now(user: User) -> tuple[bool, str | None]:
    """Check whether the user may register another stream today."""
    reset_daily_streams_if_needed(user)
    limit = daily_stream_limit(user)
    if limit is not None and user.daily_stream_count >= limit:
        return False, f"Daily stream limit of {limit} reached for the basic plan."
    return True, None


def set_user_tier(
    user: User,
    tier: str,
    *,
    end_date=None,
    is_active: bool = True,
) -> Subscription:
    """Admin helper to manually set a user's subscription tier (for testing)."""
    if tier not in SubscriptionTier.values:
        raise ValueError(f"Invalid tier: {tier}")

    sub = get_or_create_subscription(user)
    sub.tier = tier
    sub.is_active = is_active
    sub.start_date = timezone.now()
    if tier == SubscriptionTier.BASIC:
        sub.end_date = None
    else:
        sub.end_date = end_date
    sub.save()
    # Keep reverse OneToOne cache in sync for in-memory user instances.
    user.subscription = sub
    return sub
