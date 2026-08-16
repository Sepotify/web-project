from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import Notification, NotificationType
from notifications.services import notify_subscription_expiring
from subscriptions.models import Subscription, SubscriptionTier


class Command(BaseCommand):
    help = (
        "Create subscription_expiring notifications for paid plans ending within "
        "the next N days (default: 3). Safe to run repeatedly — dedupes per day."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=3,
            help="Notify when end_date is within this many days (default: 3).",
        )

    def handle(self, *args, **options):
        days = max(options["days"], 1)
        now = timezone.now()
        window_end = now + timedelta(days=days)

        qs = (
            Subscription.objects.select_related("user", "user__settings")
            .filter(
                is_active=True,
                end_date__isnull=False,
                end_date__gt=now,
                end_date__lte=window_end,
            )
            .exclude(tier=SubscriptionTier.BASIC)
        )

        created = 0
        for sub in qs:
            already = Notification.objects.filter(
                user=sub.user,
                type=NotificationType.SUBSCRIPTION_EXPIRING,
                created_at__date=timezone.localdate(),
            ).exists()
            if already:
                continue

            remaining = max((sub.end_date - now).days, 1)
            before = Notification.objects.filter(
                user=sub.user,
                type=NotificationType.SUBSCRIPTION_EXPIRING,
            ).count()
            notify_subscription_expiring(sub.user, remaining)
            after = Notification.objects.filter(
                user=sub.user,
                type=NotificationType.SUBSCRIPTION_EXPIRING,
            ).count()
            if after > before:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Checked {qs.count()} upcoming expirations; created {created} notification(s)."
            )
        )
