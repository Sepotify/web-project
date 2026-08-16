from rest_framework import serializers

from accounts.models import UserRole
from tickets.models import Ticket, TicketMessage, TicketStatus


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)
    sender_display_name = serializers.CharField(
        source="sender.display_name",
        read_only=True,
    )

    class Meta:
        model = TicketMessage
        fields = [
            "id",
            "sender_id",
            "sender_role",
            "sender_display_name",
            "content",
            "created_at",
        ]
        read_only_fields = fields


class TicketListSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_display_name = serializers.CharField(source="user.display_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "user_id",
            "user_display_name",
            "user_email",
            "subject",
            "status",
            "message_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_message_count(self, obj):
        return obj.messages.count()


class TicketDetailSerializer(TicketListSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + ["messages"]


class CreateTicketSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField()

    def validate_subject(self, value):
        subject = value.strip()
        if not subject:
            raise serializers.ValidationError("Subject is required.")
        return subject

    def validate_message(self, value):
        message = value.strip()
        if not message:
            raise serializers.ValidationError("Message is required.")
        return message

    def create(self, validated_data):
        request = self.context["request"]
        ticket = Ticket.objects.create(
            user=request.user,
            subject=validated_data["subject"],
            status=TicketStatus.OPEN,
        )
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=validated_data["message"],
        )
        return ticket


class ReplyTicketSerializer(serializers.Serializer):
    content = serializers.CharField()

    def validate_content(self, value):
        content = value.strip()
        if not content:
            raise serializers.ValidationError("Message is required.")
        return content

    def save(self, **kwargs):
        ticket: Ticket = self.context["ticket"]
        sender = self.context["request"].user
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=sender,
            content=self.validated_data["content"],
        )

        if ticket.status in (TicketStatus.OPEN, TicketStatus.IN_PROGRESS):
            # Staff replies move the ticket forward; user replies keep current status
            # unless still open.
            if sender.role in (UserRole.SUPPORT, UserRole.ADMIN):
                ticket.status = TicketStatus.IN_PROGRESS
            elif ticket.status == TicketStatus.OPEN:
                ticket.status = TicketStatus.OPEN
            ticket.save(update_fields=["status", "updated_at"])
        else:
            ticket.save(update_fields=["updated_at"])

        return message


class UpdateTicketStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TicketStatus.choices)
