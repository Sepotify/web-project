from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from accounts.services import generate_username
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier

DEMO_PASSWORD = "123456"


class Command(BaseCommand):
    help = "Seed admin, support, and demo listener/artist accounts."

    @transaction.atomic
    def handle(self, *args, **options):
        PricingConfig.get_solo()

        admin = self._ensure_user(
            email=settings.ADMIN_EMAIL.lower(),
            password=DEMO_PASSWORD,
            username="system_admin",
            display_name="System Admin",
            role=UserRole.ADMIN,
            extra={"is_staff": True, "is_superuser": True},
        )
        support = self._ensure_user(
            email=settings.SUPPORT_EMAIL.lower(),
            password=DEMO_PASSWORD,
            username="support_agent",
            display_name="Support Agent",
            role=UserRole.SUPPORT,
        )
        listener = self._ensure_user(
            email="listener@example.com",
            password=DEMO_PASSWORD,
            username="ali_listener",
            display_name="Ali Listener",
            role=UserRole.LISTENER,
        )
        artist_user = self._ensure_user(
            email="artist@example.com",
            password=DEMO_PASSWORD,
            username="sara_artist",
            display_name="Sara Artist",
            role=UserRole.ARTIST,
        )
        self._ensure_approved_artist(artist_user)

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write(f"  admin    {admin.email} / {DEMO_PASSWORD}")
        self.stdout.write(f"  support  {support.email} / {DEMO_PASSWORD}")
        self.stdout.write(f"  listener {listener.email} / {DEMO_PASSWORD}")
        self.stdout.write(f"  artist   {artist_user.email} / {DEMO_PASSWORD}")

    def _ensure_user(self, *, email, password, username, display_name, role, extra=None):
        defaults = {
            "username": username,
            "display_name": display_name,
            "role": role,
            **(extra or {}),
        }
        if User.objects.filter(username=username).exclude(email=email).exists():
            defaults["username"] = generate_username(username)

        user, created = User.objects.get_or_create(email=email, defaults=defaults)
        user.display_name = display_name
        user.role = role
        for key, value in (extra or {}).items():
            setattr(user, key, value)
        user.set_password(password)
        user.save()
        UserSettings.objects.get_or_create(user=user)
        Subscription.objects.get_or_create(
            user=user,
            defaults={
                "tier": SubscriptionTier.GOLD,
                "start_date": timezone.now(),
                "is_active": True,
            },
        )
        status = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{status} {role}: {email}"))
        return user

    def _ensure_approved_artist(self, user: User) -> None:
        profile, _ = ArtistProfile.objects.get_or_create(
            user=user,
            defaults={
                "stage_name": user.display_name,
                "portfolio": "https://example.com/sara-artist",
                "status": ArtistStatus.APPROVED,
                "is_verified": True,
            },
        )
        if profile.status != ArtistStatus.APPROVED:
            profile.status = ArtistStatus.APPROVED
            profile.is_verified = True
            profile.rejection_reason = ""
            profile.save(update_fields=["status", "is_verified", "rejection_reason"])
