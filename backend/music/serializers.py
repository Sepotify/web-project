from rest_framework import serializers

from accounts.models import ArtistProfile, ArtistStatus
from music.models import Album, Song

MIN_RELEASE_YEAR = 1900
MAX_RELEASE_YEAR = 2100


def _absolute_media_url(request, file_field):
    if not file_field:
        return None
    if request:
        return request.build_absolute_uri(file_field.url)
    return file_field.url


def _validate_release_year(value):
    if value is None:
        return value
    if value < MIN_RELEASE_YEAR or value > MAX_RELEASE_YEAR:
        raise serializers.ValidationError(
            f"Release year must be between {MIN_RELEASE_YEAR} and {MAX_RELEASE_YEAR}."
        )
    return value


class AlbumSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artist_is_verified = serializers.BooleanField(source="artist.is_verified", read_only=True)
    cover_url = serializers.SerializerMethodField()
    song_ids = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            "id",
            "title",
            "artist_id",
            "artist_name",
            "artist_is_verified",
            "cover_url",
            "genre",
            "release_year",
            "song_ids",
            "listener_count",
            "stream_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_cover_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.cover)

    def get_song_ids(self, obj):
        if hasattr(obj, "prefetched_song_ids"):
            return list(obj.prefetched_song_ids)
        return list(obj.songs.order_by("id").values_list("id", flat=True))


class SongSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artist_is_verified = serializers.BooleanField(source="artist.is_verified", read_only=True)
    album_id = serializers.IntegerField(read_only=True, allow_null=True)
    album_title = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    featured_artist_ids = serializers.PrimaryKeyRelatedField(
        source="featured_artists",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Song
        fields = [
            "id",
            "title",
            "artist_id",
            "artist_name",
            "artist_is_verified",
            "album_id",
            "album_title",
            "cover_url",
            "audio_url",
            "lyrics",
            "genre",
            "release_year",
            "featured_artist_ids",
            "duration_seconds",
            "listener_count",
            "stream_count",
            "is_early_access",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_album_title(self, obj):
        return obj.album.title if obj.album_id else None

    def get_cover_url(self, obj):
        cover = obj.cover or (obj.album.cover if obj.album_id and obj.album.cover else None)
        return _absolute_media_url(self.context.get("request"), cover)

    def get_audio_url(self, obj):
        return _absolute_media_url(self.context.get("request"), obj.audio)


class AlbumWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ["title", "cover", "genre", "release_year"]

    def validate_title(self, value):
        title = value.strip()
        if len(title) < 1:
            raise serializers.ValidationError("Title is required.")
        return title

    def validate_genre(self, value):
        return (value or "").strip()

    def validate_release_year(self, value):
        return _validate_release_year(value)

    def create(self, validated_data):
        artist = self.context["artist"]
        return Album.objects.create(artist=artist, **validated_data)


class SongWriteSerializer(serializers.ModelSerializer):
    featured_artist_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Song
        fields = [
            "title",
            "album",
            "audio",
            "cover",
            "lyrics",
            "genre",
            "release_year",
            "featured_artist_ids",
            "duration_seconds",
            "is_early_access",
        ]

    def validate_title(self, value):
        title = value.strip()
        if len(title) < 1:
            raise serializers.ValidationError("Title is required.")
        return title

    def validate_genre(self, value):
        return (value or "").strip()

    def validate_lyrics(self, value):
        return (value or "").strip()

    def validate_release_year(self, value):
        return _validate_release_year(value)

    def validate_album(self, album):
        artist = self.context.get("artist")
        if album is not None and artist is not None and album.artist_id != artist.pk:
            raise serializers.ValidationError("Album must belong to the same artist.")
        return album

    def validate_featured_artist_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        artist = self.context.get("artist")
        if artist and artist.pk in unique_ids:
            raise serializers.ValidationError("An artist cannot feature themselves.")

        found = set(
            ArtistProfile.objects.filter(
                pk__in=unique_ids,
                status=ArtistStatus.APPROVED,
            ).values_list("pk", flat=True)
        )
        if found != set(unique_ids):
            raise serializers.ValidationError(
                "One or more featured artists are invalid or not approved."
            )
        return unique_ids

    def create(self, validated_data):
        featured_ids = validated_data.pop("featured_artist_ids", [])
        artist = self.context["artist"]
        song = Song.objects.create(artist=artist, **validated_data)
        if featured_ids:
            song.featured_artists.set(featured_ids)
        return song

    def update(self, instance, validated_data):
        featured_ids = validated_data.pop("featured_artist_ids", None)
        song = super().update(instance, validated_data)
        if featured_ids is not None:
            song.featured_artists.set(featured_ids)
        return song
