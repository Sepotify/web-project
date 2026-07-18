"""
Domain signals for Person 1 events.

Artist approve/reject notifications are triggered explicitly from views
via notifications.services (avoids duplicate signals on unrelated saves).

Subscription expiry is handled here as a skeleton for Person 3.
"""

from datetime import timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from subscriptions.models import Subscription, SubscriptionTier


@receiver(post_save, sender=Subscription)
def subscription_expiry_skeleton(sender, instance: Subscription, **kwargs):
    """
    Skeleton: if a paid subscription ends within 3 days, emit an expiry notice.
    Deduplicates by checking for an unread notification of the same type today.
    """
    if instance.tier == SubscriptionTier.BASIC or not instance.end_date:
        return
    if not instance.is_active:
        return

    remaining = instance.end_date - timezone.now()
    if remaining < timedelta(0) or remaining > timedelta(days=3):
        return

    from notifications.models import Notification, NotificationType
    from notifications.services import notify_subscription_expiring

    already = Notification.objects.filter(
        user=instance.user,
        type=NotificationType.SUBSCRIPTION_EXPIRING,
        created_at__date=timezone.localdate(),
    ).exists()
    if already:
        return

    days = max(remaining.days, 1)
    notify_subscription_expiring(instance.user, days)
