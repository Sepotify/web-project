from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    SUBSCRIPTION_EXPIRING = "subscription_expiring", "Subscription expiring"
    NEW_RELEASE = "new_release", "New release"
    ARTIST_APPROVAL = "artist_approval", "Artist approval"
    ARTIST_REJECTION = "artist_rejection", "Artist rejection"
    MONTHLY_EARNINGS = "monthly_earnings", "Monthly earnings"
    NEW_TICKET = "new_ticket", "New ticket"
    ARTIST_VERIFICATION_REQUEST = (
        "artist_verification_request",
        "Artist verification request",
    )


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=64, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True, default="")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} → user:{self.user_id}"
