from accounts.models import ArtistFollow
from notifications.models import NotificationType
from notifications.services import create_notification


def notify_followers_of_new_release(artist, *, title: str, link: str, release_label: str) -> int:
    """Notify users who follow this artist about a new release. Returns count created."""
    created = 0
    followers = ArtistFollow.objects.filter(artist=artist).select_related("follower")
    message = f"{artist.stage_name} released a new {release_label}: {title}"
    for follow in followers:
        note = create_notification(
            user=follow.follower,
            type=NotificationType.NEW_RELEASE,
            title="New release",
            message=message,
            link=link,
        )
        if note is not None:
            created += 1
    return created
