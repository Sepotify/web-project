from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole, UserSettings
from notifications.models import Notification, NotificationType
from subscriptions.models import (
    PaymentStatus,
    PaymentTransaction,
    PricingConfig,
    Subscription,
    SubscriptionTier,
)
from subscriptions.payment_services import calculate_amount


class PricingAPITests(APITestCase):
    def setUp(self):
        self.pricing = PricingConfig.get_solo()
        self.admin = User.objects.create_user(
            email="admin@pricing.test",
            password="AdminPass123",
            username="admin_pricing",
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        UserSettings.objects.create(user=self.admin)
        Subscription.objects.create(user=self.admin, tier=SubscriptionTier.GOLD)

        self.listener = User.objects.create_user(
            email="listener@pricing.test",
            password="secret1",
            username="listener_pricing",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.listener)
        Subscription.objects.create(user=self.listener, tier=SubscriptionTier.BASIC)

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_public_pricing_get(self):
        res = self.client.get(reverse("pricing"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("silver_monthly", res.data)
        self.assertIn("gold_monthly", res.data)

    def test_admin_pricing_rejects_invalid_values(self):
        self._auth(self.admin)
        bad_gold = self.client.patch(
            reverse("admin-pricing"),
            {"silver_monthly": "9.99", "gold_monthly": "4.99"},
            format="json",
        )
        self.assertEqual(bad_gold.status_code, status.HTTP_400_BAD_REQUEST)

        bad_silver = self.client.patch(
            reverse("admin-pricing"),
            {"silver_monthly": "-1"},
            format="json",
        )
        self.assertEqual(bad_silver.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listener_cannot_patch_pricing(self):
        self._auth(self.listener)
        res = self.client.patch(
            reverse("admin-pricing"),
            {"silver_monthly": "7.99", "gold_monthly": "14.99"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class SubscriptionExpiryCommandTests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()
        self.user = User.objects.create_user(
            email="expiring@test.com",
            password="secret1",
            username="expiring_user",
            display_name="Expiring",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.user)
        Subscription.objects.create(
            user=self.user,
            tier=SubscriptionTier.GOLD,
            is_active=True,
            end_date=timezone.now() + timedelta(days=2),
        )

    def test_check_subscription_expiry_creates_notification(self):
        out = StringIO()
        call_command("check_subscription_expiry", stdout=out)

        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                type=NotificationType.SUBSCRIPTION_EXPIRING,
            ).exists()
        )
        self.assertIn("1", out.getvalue())

        # Second run should not duplicate for the same day
        call_command("check_subscription_expiry", stdout=StringIO())
        self.assertEqual(
            Notification.objects.filter(
                user=self.user,
                type=NotificationType.SUBSCRIPTION_EXPIRING,
            ).count(),
            1,
        )


class ZarinpalPaymentTests(APITestCase):
    def setUp(self):
        self.pricing = PricingConfig.get_solo()
        self.user = User.objects.create_user(
            email="payer@test.com",
            password="secret1",
            username="payer",
            display_name="Payer",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.user)
        Subscription.objects.create(user=self.user, tier=SubscriptionTier.BASIC)

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    @patch("subscriptions.payment_services.request_payment", return_value="XYZ")
    def test_init_creates_pending_payment_and_startpay_url(self, _mock_request):
        self._auth(self.user)
        res = self.client.post(
            reverse("payments-init"),
            {"tier": "gold", "duration_months": 3},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        expected_amount = calculate_amount(SubscriptionTier.GOLD, 3)
        self.assertEqual(res.data["authority"], "XYZ")
        self.assertEqual(res.data["amount"], expected_amount)
        self.assertEqual(
            res.data["payment_url"],
            "https://sandbox.zarinpal.com/pg/StartPay/XYZ",
        )
        payment = PaymentTransaction.objects.get(authority="XYZ")
        self.assertEqual(payment.status, PaymentStatus.PENDING)
        self.assertEqual(payment.amount, expected_amount)
        self.assertEqual(payment.user, self.user)

    @patch("subscriptions.payment_services.verify_payment")
    @patch("subscriptions.payment_services.request_payment", return_value="XYZ")
    def test_successful_verify_activates_subscription(self, _mock_request, mock_verify):
        mock_verify.return_value = {"code": 100, "ref_id": 4242}
        self._auth(self.user)
        self.client.post(
            reverse("payments-init"),
            {"tier": "gold", "duration_months": 1},
            format="json",
        )

        self.client.credentials()
        verify = self.client.post(
            reverse("payments-verify"),
            {"authority": "XYZ", "status": "OK"},
            format="json",
        )
        self.assertEqual(verify.status_code, status.HTTP_200_OK, verify.data)
        self.assertEqual(verify.data["status"], PaymentStatus.SUCCESS)
        self.assertEqual(verify.data["ref_id"], "4242")
        self.user.subscription.refresh_from_db()
        self.assertEqual(self.user.subscription.tier, SubscriptionTier.GOLD)
        self.assertTrue(self.user.subscription.is_active)
        self.assertIsNotNone(self.user.subscription.end_date)

        second = self.client.post(
            reverse("payments-verify"),
            {"authority": "XYZ", "status": "OK"},
            format="json",
        )
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertTrue(second.data["already_verified"])
        mock_verify.assert_called_once()

    @patch("subscriptions.payment_services.verify_payment")
    @patch("subscriptions.payment_services.request_payment", return_value="XYZ")
    def test_failed_gateway_status_does_not_upgrade(self, _mock_request, mock_verify):
        self._auth(self.user)
        self.client.post(
            reverse("payments-init"),
            {"tier": "silver", "duration_months": 1},
            format="json",
        )

        self.client.credentials()
        verify = self.client.post(
            reverse("payments-verify"),
            {"authority": "XYZ", "status": "NOK"},
            format="json",
        )
        self.assertEqual(verify.status_code, status.HTTP_200_OK, verify.data)
        self.assertEqual(verify.data["status"], PaymentStatus.FAILED)
        mock_verify.assert_not_called()
        self.user.subscription.refresh_from_db()
        self.assertEqual(self.user.subscription.tier, SubscriptionTier.BASIC)
