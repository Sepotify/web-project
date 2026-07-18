from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from accounts.permissions import IsAdmin, IsApprovedArtist, IsSupportOrAdmin
from notifications.models import Notification, NotificationType
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier
from subscriptions.services import (
    can_upload_avatar,
    daily_stream_limit,
    max_playlists,
    set_user_tier,
)


class Person1APITests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="AdminPass123",
            username="admin_test",
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        UserSettings.objects.create(user=self.admin)
        Subscription.objects.create(user=self.admin, tier=SubscriptionTier.GOLD)

        self.support = User.objects.create_user(
            email="support@test.com",
            password="SupportPass123",
            username="support_test",
            display_name="Support",
            role=UserRole.SUPPORT,
        )
        UserSettings.objects.create(user=self.support)
        Subscription.objects.create(user=self.support, tier=SubscriptionTier.GOLD)

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_register_and_login(self):
        """1) Listener registration and login work with JWT."""
        register_url = reverse("auth-register")
        payload = {
            "display_name": "Ali Listener",
            "email": "ali@example.com",
            "password": "secret1",
            "confirm_password": "secret1",
            "birth_date": "2000-05-15",
            "gender": "male",
            "accepted_privacy_policy": True,
        }
        res = self.client.post(register_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn("tokens", res.data)
        self.assertEqual(res.data["user"]["role"], "listener")
        self.assertEqual(res.data["user"]["subscription"], "basic")
        self.assertTrue(UserSettings.objects.filter(user_id=res.data["user"]["id"]).exists())

        login_url = reverse("auth-login")
        login = self.client.post(
            login_url,
            {"email": "ali@example.com", "password": "secret1"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK, login.data)
        self.assertIn("access", login.data["tokens"])

    def test_artist_approve_flow(self):
        """2) Support/admin can approve a pending artist and notify them."""
        reg = self.client.post(
            reverse("artists-register"),
            {
                "email": "nova@example.com",
                "password": "secret1",
                "confirm_password": "secret1",
                "stage_name": "Nova Waves",
                "portfolio": "https://soundcloud.com/nova demo tracks 2026",
                "accepted_privacy_policy": True,
            },
            format="json",
        )
        self.assertEqual(reg.status_code, status.HTTP_201_CREATED, reg.data)
        artist_id = reg.data["artist"]["id"]
        self.assertEqual(reg.data["artist"]["status"], "pending")

        # Staff received verification request notification
        self.assertTrue(
            Notification.objects.filter(
                user=self.support,
                type=NotificationType.ARTIST_VERIFICATION_REQUEST,
            ).exists()
        )

        self._auth(self.support)
        approve = self.client.post(reverse("artists-approve", kwargs={"pk": artist_id}))
        self.assertEqual(approve.status_code, status.HTTP_200_OK, approve.data)
        self.assertEqual(approve.data["status"], ArtistStatus.APPROVED)
        self.assertTrue(approve.data["is_verified"])

        artist_user = User.objects.get(email="nova@example.com")
        self.assertTrue(
            Notification.objects.filter(
                user=artist_user,
                type=NotificationType.ARTIST_APPROVAL,
            ).exists()
        )

    def test_settings_get_and_patch(self):
        """3) User settings sync API works."""
        user = User.objects.create_user(
            email="settings@example.com",
            password="secret1",
            username="settings_user",
            display_name="Settings User",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=user)
        Subscription.objects.create(user=user, tier=SubscriptionTier.BASIC)
        self._auth(user)

        get_res = self.client.get(reverse("users-me-settings"))
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertIn("notification_preferences", get_res.data)

        patch_res = self.client.patch(
            reverse("users-me-settings"),
            {
                "language": "fa",
                "default_volume": 0.4,
                "notification_preferences": {
                    "new_release": False,
                    "subscription_expiring": True,
                },
            },
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK, patch_res.data)
        self.assertEqual(patch_res.data["language"], "fa")
        self.assertEqual(patch_res.data["default_volume"], 0.4)
        self.assertFalse(patch_res.data["notification_preferences"]["new_release"])

    def test_role_permissions(self):
        """4) Role-based permission classes enforce access correctly."""
        listener = User.objects.create_user(
            email="listener@example.com",
            password="secret1",
            username="listener_user",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=listener)
        Subscription.objects.create(user=listener, tier=SubscriptionTier.BASIC)

        pending_artist = User.objects.create_user(
            email="pending@example.com",
            password="secret1",
            username="pending_artist",
            display_name="Pending",
            role=UserRole.ARTIST,
        )
        ArtistProfile.objects.create(
            user=pending_artist,
            stage_name="Pending",
            portfolio="portfolio sample works here",
            status=ArtistStatus.PENDING,
        )

        class DummyRequest:
            def __init__(self, user):
                self.user = user

        class DummyView:
            pass

        self.assertTrue(IsAdmin().has_permission(DummyRequest(self.admin), DummyView()))
        self.assertFalse(IsAdmin().has_permission(DummyRequest(self.support), DummyView()))
        self.assertTrue(
            IsSupportOrAdmin().has_permission(DummyRequest(self.support), DummyView())
        )
        self.assertFalse(
            IsSupportOrAdmin().has_permission(DummyRequest(listener), DummyView())
        )
        self.assertFalse(
            IsApprovedArtist().has_permission(DummyRequest(pending_artist), DummyView())
        )

        # Listener cannot access pending artists list
        self._auth(listener)
        denied = self.client.get(reverse("artists-pending"))
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self._auth(self.support)
        allowed = self.client.get(reverse("artists-pending"))
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)

        # Capability helpers
        self.assertFalse(can_upload_avatar(listener))
        self.assertEqual(max_playlists(listener), 6)
        self.assertEqual(daily_stream_limit(listener), 60)
        set_user_tier(listener, SubscriptionTier.GOLD)
        self.assertTrue(can_upload_avatar(listener))
        self.assertIsNone(max_playlists(listener))

    def test_admin_can_update_pricing(self):
        """5) Admin can change silver/gold prices; others cannot."""
        self._auth(self.support)
        forbidden = self.client.patch(
            reverse("admin-pricing"),
            {"silver_monthly": 50000, "gold_monthly": 150000},
            format="json",
        )
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self._auth(self.admin)
        ok = self.client.patch(
            reverse("admin-pricing"),
            {"silver_monthly": "50000.00", "gold_monthly": "150000.00"},
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK, ok.data)
        self.assertEqual(float(ok.data["silver_monthly"]), 50000.0)
        self.assertEqual(float(ok.data["gold_monthly"]), 150000.0)

        public = self.client.get(reverse("pricing"))
        # pricing is AllowAny — clear credentials
        self.client.credentials()
        public = self.client.get(reverse("pricing"))
        self.assertEqual(public.status_code, status.HTTP_200_OK)
        self.assertEqual(float(public.data["silver_monthly"]), 50000.0)
