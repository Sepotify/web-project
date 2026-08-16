from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole, UserSettings
from notifications.models import Notification, NotificationType
from tickets.models import Ticket, TicketMessage, TicketStatus


class TicketsAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="AdminPass123",
            username="admin_test",
            display_name="Admin",
            role=UserRole.ADMIN,
        )
        UserSettings.objects.create(user=self.admin)

        self.support = User.objects.create_user(
            email="support@test.com",
            password="SupportPass123",
            username="support_test",
            display_name="Support",
            role=UserRole.SUPPORT,
        )
        UserSettings.objects.create(user=self.support)

        self.listener = User.objects.create_user(
            email="listener@test.com",
            password="ListenerPass123",
            username="listener_test",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.listener)

        self.other = User.objects.create_user(
            email="other@test.com",
            password="OtherPass123",
            username="other_test",
            display_name="Other",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.other)

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_listener_creates_ticket_and_notifies_staff(self):
        self._auth(self.listener)
        res = self.client.post(
            reverse("tickets-list-create"),
            {"subject": "Can't play songs", "message": "Player stuck on load."},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["subject"], "Can't play songs")
        self.assertEqual(res.data["status"], TicketStatus.OPEN)
        self.assertEqual(len(res.data["messages"]), 1)
        self.assertEqual(Ticket.objects.count(), 1)
        self.assertEqual(TicketMessage.objects.count(), 1)
        self.assertTrue(
            Notification.objects.filter(
                user=self.support,
                type=NotificationType.NEW_TICKET,
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.admin,
                type=NotificationType.NEW_TICKET,
            ).exists()
        )

    def test_staff_lists_all_tickets_user_lists_own(self):
        own = Ticket.objects.create(user=self.listener, subject="Mine")
        TicketMessage.objects.create(ticket=own, sender=self.listener, content="Hi")
        other = Ticket.objects.create(user=self.other, subject="Theirs")
        TicketMessage.objects.create(ticket=other, sender=self.other, content="Hello")

        self._auth(self.listener)
        mine = self.client.get(reverse("tickets-list-create"))
        self.assertEqual(mine.status_code, status.HTTP_200_OK)
        self.assertEqual(mine.data["count"], 1)
        self.assertEqual(mine.data["results"][0]["id"], own.id)

        self._auth(self.support)
        all_tickets = self.client.get(reverse("tickets-list-create"))
        self.assertEqual(all_tickets.status_code, status.HTTP_200_OK)
        self.assertEqual(all_tickets.data["count"], 2)

    def test_user_cannot_view_others_ticket(self):
        ticket = Ticket.objects.create(user=self.other, subject="Private")
        TicketMessage.objects.create(ticket=ticket, sender=self.other, content="Secret")

        self._auth(self.listener)
        res = self.client.get(reverse("tickets-detail", kwargs={"pk": ticket.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_reply_and_status_update(self):
        self._auth(self.listener)
        created = self.client.post(
            reverse("tickets-list-create"),
            {"subject": "Billing", "message": "Charged twice"},
            format="json",
        )
        ticket_id = created.data["id"]

        self._auth(self.support)
        reply = self.client.post(
            reverse("tickets-reply", kwargs={"pk": ticket_id}),
            {"content": "Looking into it."},
            format="json",
        )
        self.assertEqual(reply.status_code, status.HTTP_200_OK, reply.data)
        self.assertEqual(reply.data["status"], TicketStatus.IN_PROGRESS)
        self.assertEqual(len(reply.data["messages"]), 2)
        self.assertTrue(
            Notification.objects.filter(
                user=self.listener,
                type=NotificationType.NEW_TICKET,
                title="Support replied to your ticket",
            ).exists()
        )

        status_res = self.client.patch(
            reverse("tickets-status", kwargs={"pk": ticket_id}),
            {"status": TicketStatus.RESOLVED},
            format="json",
        )
        self.assertEqual(status_res.status_code, status.HTTP_200_OK, status_res.data)
        self.assertEqual(status_res.data["status"], TicketStatus.RESOLVED)

    def test_staff_cannot_create_ticket(self):
        self._auth(self.support)
        res = self.client.post(
            reverse("tickets-list-create"),
            {"subject": "Nope", "message": "Staff should not open tickets"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_listener_cannot_update_status(self):
        ticket = Ticket.objects.create(user=self.listener, subject="Status")
        self._auth(self.listener)
        res = self.client.patch(
            reverse("tickets-status", kwargs={"pk": ticket.pk}),
            {"status": TicketStatus.CLOSED},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
