from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from notifications.models import Notification


class NotificationSerializer(ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        data = NotificationSerializer(qs, many=True).data
        # Empty list is a valid empty state for the frontend.
        return Response(
            {
                "count": len(data),
                "unread_count": qs.filter(is_read=False).count(),
                "results": data,
            }
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)


class NotificationDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"detail": "All notifications marked as read.", "updated": updated})
