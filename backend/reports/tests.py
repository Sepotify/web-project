from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from io import BytesIO
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from catalog.models import Song
from reports.models import ArtistSettlement, SettlementStatus
from reports.services import calculate_artist_earnings, current_month_key
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier


def _png():
    buf = BytesIO()
    Image.new("RGB", (1, 1), color=(10, 10, 10)).save(buf, format="PNG")
    return buf.getvalue()


class ReportsAPITests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="Pass1234",
            username="admin",
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        UserSettings.objects.create(user=self.admin)
        Subscription.objects.create(user=self.admin, tier=SubscriptionTier.GOLD)

        self.listener = User.objects.create_user(
            email="listener@test.com",
            password="Pass1234",
            username="listener",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.listener)
        Subscription.objects.create(user=self.listener, tier=SubscriptionTier.SILVER)

        self.artist_user = User.objects.create_user(
            email="artist@test.com",
            password="Pass1234",
            username="artist",
            display_name="Artist",
            role=UserRole.ARTIST,
        )
        UserSettings.objects.create(user=self.artist_user)
        Subscription.objects.create(user=self.artist_user, tier=SubscriptionTier.BASIC)
        self.artist = ArtistProfile.objects.create(
            user=self.artist_user,
            stage_name="Nova",
            portfolio="demo",
            status=ArtistStatus.APPROVED,
            total_streams=1000,
            total_listeners=100,
        )

        Song.objects.create(
            artist=self.artist,
            title="Hit",
            genre="Pop",
            release_year=2026,
            audio=SimpleUploadedFile("a.mp3", b"ID3" + b"\x00" * 20, content_type="audio/mpeg"),
            cover=SimpleUploadedFile("c.png", _png(), content_type="image/png"),
            listener_count=50,
            stream_count=200,
            is_early_access=True,
        )

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_distribution_admin_only(self):
        self._auth(self.listener)
        denied = self.client.get(reverse("admin-analytics-distribution"))
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self._auth(self.admin)
        ok = self.client.get(reverse("admin-analytics-distribution"))
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        tiers = {row["tier"]: row["count"] for row in ok.data["results"]}
        self.assertEqual(tiers["gold"], 1)
        self.assertEqual(tiers["silver"], 1)
        self.assertEqual(tiers["basic"], 1)

    def test_revenue_math(self):
        self._auth(self.admin)
        pricing = PricingConfig.get_solo()
        res = self.client.get(reverse("admin-analytics-revenue"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        expected = float(pricing.silver_monthly + pricing.gold_monthly)
        self.assertEqual(res.data["total_revenue"], expected)
        self.assertEqual(res.data["silver_subscribers"], 1)
        self.assertEqual(res.data["gold_subscribers"], 1)

    def test_settlements_sync_and_confirm(self):
        self._auth(self.admin)
        month = current_month_key()
        listed = self.client.get(reverse("admin-finance-settlements"), {"month": month})
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(listed.data["count"], 1)
        settlement_id = listed.data["results"][0]["id"]
        self.assertEqual(
            float(listed.data["results"][0]["payout_amount"]),
            float(calculate_artist_earnings(200)),
        )

        confirm = self.client.post(
            reverse("admin-finance-settlements-confirm", kwargs={"pk": settlement_id})
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm.data["status"], SettlementStatus.PAID)
        self.assertTrue(
            ArtistSettlement.objects.get(pk=settlement_id).paid_at is not None
        )

    def test_home_feed_public(self):
        res = self.client.get(reverse("home-feed"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["popular_songs"]), 1)
        self.assertEqual(len(res.data["early_access_songs"]), 1)

    def test_record_stream(self):
        song = Song.objects.first()
        self._auth(self.listener)
        res = self.client.post(reverse("songs-stream", kwargs={"pk": song.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        song.refresh_from_db()
        self.assertEqual(song.stream_count, 201)
