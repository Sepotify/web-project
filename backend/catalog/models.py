from django.db import models

from catalog.validators import validate_audio_file, validate_cover_file


class Album(models.Model):
    artist = models.ForeignKey(
        "accounts.ArtistProfile",
        on_delete=models.CASCADE,
        related_name="albums",
    )
    title = models.CharField(max_length=200)
    genre = models.CharField(max_length=100, blank=True, default="")
    release_year = models.PositiveIntegerField()
    cover = models.ImageField(
        upload_to="covers/",
        blank=True,
        null=True,
        validators=[validate_cover_file],
    )
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist.stage_name}"


class Song(models.Model):
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
    title = models.CharField(max_length=200)
    lyrics = models.TextField(blank=True, default="")
    genre = models.CharField(max_length=100, blank=True, default="")
    release_year = models.PositiveIntegerField()
    cover = models.ImageField(
        upload_to="covers/",
        blank=True,
        null=True,
        validators=[validate_cover_file],
    )
    audio = models.FileField(
        upload_to="audio/",
        validators=[validate_audio_file],
    )
    duration_seconds = models.PositiveIntegerField(default=180)
    is_early_access = models.BooleanField(default=False)
    featured_artists = models.ManyToManyField(
        "accounts.ArtistProfile",
        related_name="featured_on_songs",
        blank=True,
    )
    listener_count = models.PositiveIntegerField(default=0)
    stream_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.artist.stage_name}"
