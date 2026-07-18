from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User, UserRole, UserSettings
from accounts.services import generate_username
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier


class Command(BaseCommand):
    help = "Seed the single admin user, a support user, and default pricing."

    @transaction.atomic
    def handle(self, *args, **options):
        PricingConfig.get_solo()

        admin_email = settings.ADMIN_EMAIL.lower()
        support_email = settings.SUPPORT_EMAIL.lower()

        admin, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "username": "system_admin",
                "display_name": "System Admin",
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password(settings.ADMIN_PASSWORD)
            admin.save()
            UserSettings.objects.get_or_create(user=admin)
            Subscription.objects.get_or_create(
                user=admin,
                defaults={
                    "tier": SubscriptionTier.GOLD,
                    "start_date": timezone.now(),
                    "is_active": True,
                },
            )
            self.stdout.write(self.style.SUCCESS(f"Created admin: {admin_email}"))
        else:
            self.stdout.write(f"Admin already exists: {admin_email}")

        support, created = User.objects.get_or_create(
            email=support_email,
            defaults={
                "username": generate_username("support"),
                "display_name": "Support Agent",
                "role": UserRole.SUPPORT,
            },
        )
        if created:
            support.set_password(settings.SUPPORT_PASSWORD)
            support.save()
            UserSettings.objects.get_or_create(user=support)
            Subscription.objects.get_or_create(
                user=support,
                defaults={
                    "tier": SubscriptionTier.GOLD,
                    "start_date": timezone.now(),
                    "is_active": True,
                },
            )
            self.stdout.write(self.style.SUCCESS(f"Created support: {support_email}"))
        else:
            self.stdout.write(f"Support already exists: {support_email}")

        self.stdout.write(self.style.SUCCESS("Seed complete."))
