from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole, UserSettings
from notifications.models import Notification, NotificationType
from notifications.services import create_notification
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier


class NotificationAPITests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()
        self.user = User.objects.create_user(
            email="listener@test.com",
            password="secret1",
            username="listener_n",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.user)
        Subscription.objects.create(user=self.user, tier=SubscriptionTier.SILVER)

        self.other = User.objects.create_user(
            email="other@test.com",
            password="secret1",
            username="other_n",
            display_name="Other",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.other)
        Subscription.objects.create(user=self.other, tier=SubscriptionTier.BASIC)

        self.own = Notification.objects.create(
            user=self.user,
            type=NotificationType.NEW_RELEASE,
            title="New release",
            message="A followed artist released a track.",
            link="/albums/1",
            is_read=False,
        )
        Notification.objects.create(
            user=self.other,
            type=NotificationType.SUBSCRIPTION_EXPIRING,
            title="Other user's notice",
            message="Should not appear for listener.",
            is_read=False,
        )

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_list_returns_only_own_notifications(self):
        self._auth(self.user)
        res = self.client.get(reverse("notifications-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["unread_count"], 1)
        self.assertEqual(res.data["results"][0]["id"], self.own.pk)

    def test_mark_read_and_mark_all(self):
        Notification.objects.create(
            user=self.user,
            type=NotificationType.SUBSCRIPTION_EXPIRING,
            title="Expiring",
            message="Ends soon",
            is_read=False,
        )
        self._auth(self.user)

        mark = self.client.patch(reverse("notifications-mark-read", kwargs={"pk": self.own.pk}))
        self.assertEqual(mark.status_code, status.HTTP_200_OK)
        self.assertTrue(mark.data["is_read"])
        self.own.refresh_from_db()
        self.assertTrue(self.own.is_read)

        all_read = self.client.post(reverse("notifications-mark-all-read"))
        self.assertEqual(all_read.status_code, status.HTTP_200_OK)
        self.assertEqual(all_read.data["updated"], 1)
        self.assertEqual(
            Notification.objects.filter(user=self.user, is_read=False).count(),
            0,
        )

    def test_delete_own_notification(self):
        self._auth(self.user)
        res = self.client.delete(reverse("notifications-delete", kwargs={"pk": self.own.pk}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=self.own.pk).exists())

    def test_cannot_read_or_delete_others_notification(self):
        other_note = Notification.objects.get(user=self.other)
        self._auth(self.user)

        mark = self.client.patch(
            reverse("notifications-mark-read", kwargs={"pk": other_note.pk})
        )
        self.assertEqual(mark.status_code, status.HTTP_404_NOT_FOUND)

        delete = self.client.delete(
            reverse("notifications-delete", kwargs={"pk": other_note.pk})
        )
        self.assertEqual(delete.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_notification_respects_user_preferences(self):
        settings_obj = self.user.settings
        settings_obj.notify_new_release = False
        settings_obj.save(update_fields=["notify_new_release"])

        created = create_notification(
            user=self.user,
            type=NotificationType.NEW_RELEASE,
            title="Blocked",
            message="Should not be created",
        )
        self.assertIsNone(created)
        self.assertFalse(
            Notification.objects.filter(user=self.user, title="Blocked").exists()
        )
