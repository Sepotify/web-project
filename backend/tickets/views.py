from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsSupportOrAdmin
from notifications.services import notify_staff_new_ticket, notify_ticket_reply
from tickets.models import Ticket
from tickets.serializers import (
    CreateTicketSerializer,
    ReplyTicketSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    UpdateTicketStatusSerializer,
)


def _is_staff(user) -> bool:
    return user.role in (UserRole.SUPPORT, UserRole.ADMIN)


class TicketListCreateView(APIView):
    """
    GET  /api/tickets/     — staff: all tickets; users: own tickets
    POST /api/tickets/     — listener/artist open a ticket
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _is_staff(request.user):
            qs = Ticket.objects.select_related("user").prefetch_related("messages")
        else:
            qs = (
                Ticket.objects.filter(user=request.user)
                .select_related("user")
                .prefetch_related("messages")
            )
        return Response(
            {
                "count": qs.count(),
                "results": TicketListSerializer(qs, many=True).data,
            }
        )

    def post(self, request):
        if _is_staff(request.user):
            return Response(
                {"detail": "Staff accounts cannot open support tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CreateTicketSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        notify_staff_new_ticket(ticket)
        return Response(
            TicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED,
        )


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        ticket = get_object_or_404(
            Ticket.objects.select_related("user").prefetch_related("messages", "messages__sender"),
            pk=pk,
        )
        if not _is_staff(request.user) and ticket.user_id != request.user.id:
            return None
        return ticket

    def get(self, request, pk):
        ticket = self.get_object(request, pk)
        if ticket is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TicketDetailSerializer(ticket).data)


class TicketReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ticket = get_object_or_404(Ticket.objects.select_related("user"), pk=pk)
        if not _is_staff(request.user) and ticket.user_id != request.user.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReplyTicketSerializer(
            data=request.data,
            context={"request": request, "ticket": ticket},
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        notify_ticket_reply(ticket, message)
        ticket.refresh_from_db()
        return Response(TicketDetailSerializer(ticket).data, status=status.HTTP_200_OK)


class TicketStatusUpdateView(APIView):
    permission_classes = [IsSupportOrAdmin]

    def patch(self, request, pk):
        ticket = get_object_or_404(Ticket, pk=pk)
        serializer = UpdateTicketStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket.status = serializer.validated_data["status"]
        ticket.save(update_fields=["status", "updated_at"])
        return Response(TicketDetailSerializer(ticket).data)
