from django.db.models import Q, QuerySet
from django.db.models.functions import Coalesce

from accounts.models import ArtistStatus
from music.models import Album, Playlist, Song
from subscriptions.services import can_early_access

CATALOG_SORT_CHOICES = (
    "newest",
    "oldest",
    "most_listeners",
    "most_streams",
    "title_asc",
)

DEFAULT_CATALOG_SORT = "newest"


def apply_catalog_search(queryset: QuerySet, query: str) -> QuerySet:
    normalized = (query or "").strip()
    if not normalized:
        return queryset
    return queryset.filter(
        Q(title__icontains=normalized) | Q(artist__stage_name__icontains=normalized)
    )


def apply_catalog_sort(queryset: QuerySet, sort: str) -> QuerySet:
    key = sort if sort in CATALOG_SORT_CHOICES else DEFAULT_CATALOG_SORT
    queryset = queryset.annotate(_release_year=Coalesce("release_year", 0))

    ordering = {
        "newest": ("-_release_year", "-created_at"),
        "oldest": ("_release_year", "created_at"),
        "most_listeners": ("-listener_count", "-created_at"),
        "most_streams": ("-stream_count", "-created_at"),
        "title_asc": ("title",),
    }[key]
    return queryset.order_by(*ordering)


HOME_ALBUM_LIMIT = 6
HOME_PLAYLIST_LIMIT = 6
HOME_SONG_LIMIT = 6


def visible_songs_for_user(queryset: QuerySet, user) -> QuerySet:
    """Hide early-access tracks unless the viewer has gold early-access."""
    if user is None or not getattr(user, "is_authenticated", False) or not can_early_access(user):
        return queryset.filter(is_early_access=False)
    return queryset


def _published_songs():
    return (
        Song.objects.filter(artist__status=ArtistStatus.APPROVED)
        .select_related("artist", "album")
        .prefetch_related("featured_artists")
    )


def get_home_feed(user):
    albums = apply_catalog_sort(
        Album.objects.filter(artist__status=ArtistStatus.APPROVED).select_related("artist"),
        "newest",
    )[:HOME_ALBUM_LIMIT]

    popular = apply_catalog_sort(
        visible_songs_for_user(_published_songs().filter(is_early_access=False), user),
        "most_listeners",
    )[:HOME_SONG_LIMIT]

    playlists = Playlist.objects.filter(user=user).order_by("-updated_at")[:HOME_PLAYLIST_LIMIT]

    early_access = []
    if can_early_access(user):
        early_access = list(
            apply_catalog_sort(
                _published_songs().filter(is_early_access=True),
                "newest",
            )[:HOME_SONG_LIMIT]
        )

    return {
        "recent_playlists": list(playlists),
        "latest_albums": list(albums),
        "popular_songs": list(popular),
        "early_access_songs": early_access,
    }
