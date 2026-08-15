from django.conf import settings
from django.db import models

from music.validators import validate_audio_file, validate_cover_file


class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(
        "accounts.ArtistProfile",
        on_delete=models.CASCADE,
        related_name="albums",
    )
    cover = models.ImageField(
        upload_to="covers/",
        blank=True,
        null=True,
        validators=[validate_cover_file],
    )
    genre = models.CharField(max_length=80, blank=True, default="")
    release_year = models.PositiveIntegerField(blank=True, null=True)
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist_id}"


class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(
        "accounts.ArtistProfile",
        on_delete=models.CASCADE,
        related_name="songs",
    )
    album = models.ForeignKey(
        Album,
        on_delete=models.CASCADE,
        related_name="songs",
        blank=True,
        null=True,
    )
    audio = models.FileField(upload_to="audio/", validators=[validate_audio_file])
    cover = models.ImageField(
        upload_to="covers/",
        blank=True,
        null=True,
        validators=[validate_cover_file],
    )
    lyrics = models.TextField(blank=True, default="")
    genre = models.CharField(max_length=80, blank=True, default="")
    release_year = models.PositiveIntegerField(blank=True, null=True)
    featured_artists = models.ManyToManyField(
        "accounts.ArtistProfile",
        related_name="featured_on_songs",
        blank=True,
    )
    duration_seconds = models.PositiveIntegerField(default=0)
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)
    is_early_access = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist_id}"


class Playlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlists",
    )
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.user_id})"


class PlaylistSong(models.Model):
    playlist = models.ForeignKey(
        Playlist,
        on_delete=models.CASCADE,
        related_name="playlist_songs",
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name="playlist_entries",
    )
    order = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["playlist", "song"],
                name="unique_playlist_song",
            ),
        ]

    def __str__(self):
        return f"playlist:{self.playlist_id} song:{self.song_id} #{self.order}"


class StreamEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stream_events",
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name="stream_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "song"]),
            models.Index(fields=["song", "created_at"]),
        ]

    def __str__(self):
        return f"user:{self.user_id} streamed song:{self.song_id}"
