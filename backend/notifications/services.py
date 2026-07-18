from accounts.models import User, UserRole, UserSettings
from notifications.models import Notification, NotificationType


NOTIFICATION_PREF_FIELD = {
    NotificationType.SUBSCRIPTION_EXPIRING: "notify_subscription_expiring",
    NotificationType.NEW_RELEASE: "notify_new_release",
    NotificationType.ARTIST_APPROVAL: "notify_artist_approval",
    NotificationType.ARTIST_REJECTION: "notify_artist_rejection",
    NotificationType.MONTHLY_EARNINGS: "notify_monthly_earnings",
    NotificationType.NEW_TICKET: "notify_new_ticket",
    NotificationType.ARTIST_VERIFICATION_REQUEST: "notify_artist_verification_request",
}


def _pref_allows(user: User, ntype: str) -> bool:
    try:
        settings_obj = user.settings
    except UserSettings.DoesNotExist:
        return True
    field = NOTIFICATION_PREF_FIELD.get(ntype)
    if not field:
        return True
    return bool(getattr(settings_obj, field, True))


def create_notification(
    *,
    user: User,
    type: str,
    title: str,
    message: str,
    link: str = "",
) -> Notification | None:
    if not _pref_allows(user, type):
        return None
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        link=link or "",
    )


def notify_staff_artist_verification(artist) -> None:
    staff = User.objects.filter(role__in=[UserRole.SUPPORT, UserRole.ADMIN], is_active=True)
    for user in staff:
        create_notification(
            user=user,
            type=NotificationType.ARTIST_VERIFICATION_REQUEST,
            title="New artist verification request",
            message=f"{artist.stage_name} requested artist verification.",
            link=f"/dashboard/artists/{artist.pk}",
        )


def notify_artist_approval(artist) -> None:
    create_notification(
        user=artist.user,
        type=NotificationType.ARTIST_APPROVAL,
        title="Artist account approved",
        message="Your artist account has been approved. You can now publish works.",
        link="/artist/works",
    )


def notify_artist_rejection(artist) -> None:
    reason = artist.rejection_reason or "No reason provided."
    create_notification(
        user=artist.user,
        type=NotificationType.ARTIST_REJECTION,
        title="Artist account rejected",
        message=f"Your artist application was rejected. Reason: {reason}",
        link="/register/pending",
    )


def notify_subscription_expiring(user: User, days_remaining: int) -> None:
    day_label = "day" if days_remaining == 1 else "days"
    create_notification(
        user=user,
        type=NotificationType.SUBSCRIPTION_EXPIRING,
        title="Subscription expiring soon",
        message=(
            f"Your subscription ends in {days_remaining} {day_label}. "
            "Renew to keep your playlist limits and perks."
        ),
        link="/settings",
    )
