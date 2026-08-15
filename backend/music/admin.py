from django.contrib import admin

from music.models import Album, Playlist, PlaylistSong, Song, StreamEvent


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "artist",
        "genre",
        "release_year",
        "listener_count",
        "stream_count",
        "created_at",
    )
    list_filter = ("genre", "release_year")
    search_fields = ("title", "artist__stage_name")


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "artist",
        "album",
        "genre",
        "release_year",
        "is_early_access",
        "listener_count",
        "stream_count",
        "created_at",
    )
    list_filter = ("is_early_access", "genre", "release_year")
    search_fields = ("title", "artist__stage_name", "album__title")
    filter_horizontal = ("featured_artists",)


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "created_at", "updated_at")
    search_fields = ("name", "user__email", "user__display_name")


@admin.register(PlaylistSong)
class PlaylistSongAdmin(admin.ModelAdmin):
    list_display = ("id", "playlist", "song", "order", "added_at")
    search_fields = ("playlist__name", "song__title")


@admin.register(StreamEvent)
class StreamEventAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "song", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "song__title")
