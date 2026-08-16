from rest_framework import serializers

from accounts.models import ArtistProfile, ArtistStatus
from catalog.models import Album, Song
from catalog.validators import validate_audio_file, validate_cover_file


def absolute_media_url(request, field) -> str | None:
    if not field:
        return None
    url = field.url
    if request is not None:
        return request.build_absolute_uri(url)
    return url


class SongSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_stage_name = serializers.CharField(source="artist.stage_name", read_only=True)
    album_id = serializers.IntegerField(read_only=True, allow_null=True)
    cover_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    featured_artist_ids = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            "id",
            "artist_id",
            "artist_stage_name",
            "album_id",
            "title",
            "lyrics",
            "genre",
            "release_year",
            "cover_url",
            "audio_url",
            "duration_seconds",
            "is_early_access",
            "featured_artist_ids",
            "listener_count",
            "stream_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_cover_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.cover)

    def get_audio_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.audio)

    def get_featured_artist_ids(self, obj):
        return list(obj.featured_artists.values_list("id", flat=True))


class AlbumSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(read_only=True)
    artist_stage_name = serializers.CharField(source="artist.stage_name", read_only=True)
    cover_url = serializers.SerializerMethodField()
    song_ids = serializers.SerializerMethodField()
    songs = SongSerializer(many=True, read_only=True)

    class Meta:
        model = Album
        fields = [
            "id",
            "artist_id",
            "artist_stage_name",
            "title",
            "genre",
            "release_year",
            "cover_url",
            "song_ids",
            "songs",
            "listener_count",
            "stream_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_cover_url(self, obj):
        return absolute_media_url(self.context.get("request"), obj.cover)

    def get_song_ids(self, obj):
        return list(obj.songs.values_list("id", flat=True))


class SongWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    lyrics = serializers.CharField(required=False, allow_blank=True, default="")
    genre = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    release_year = serializers.IntegerField(min_value=1900, max_value=2100)
    album_id = serializers.IntegerField(required=False, allow_null=True)
    duration_seconds = serializers.IntegerField(required=False, min_value=1, default=180)
    is_early_access = serializers.BooleanField(required=False, default=False)
    featured_artist_ids = serializers.CharField(required=False, allow_blank=True, default="")
    audio = serializers.FileField()
    cover = serializers.ImageField(required=False, allow_null=True)

    def validate_audio(self, value):
        validate_audio_file(value)
        return value

    def validate_cover(self, value):
        if value:
            validate_cover_file(value)
        return value

    def validate_featured_artist_ids(self, value):
        if not value or not str(value).strip():
            return []
        ids = []
        for part in str(value).split(","):
            part = part.strip()
            if not part:
                continue
            try:
                ids.append(int(part))
            except ValueError as exc:
                raise serializers.ValidationError("featured_artist_ids must be comma-separated integers.") from exc
        return ids

    def validate(self, attrs):
        album_id = attrs.get("album_id")
        artist: ArtistProfile = self.context["artist"]
        if album_id is not None:
            try:
                album = Album.objects.get(pk=album_id, artist=artist)
            except Album.DoesNotExist as exc:
                raise serializers.ValidationError({"album_id": "Album not found for this artist."}) from exc
            attrs["album"] = album
        else:
            attrs["album"] = None
        return attrs

    def create(self, validated_data):
        artist: ArtistProfile = self.context["artist"]
        featured_ids = validated_data.pop("featured_artist_ids", [])
        album = validated_data.pop("album", None)
        validated_data.pop("album_id", None)

        song = Song.objects.create(
            artist=artist,
            album=album,
            title=validated_data["title"].strip(),
            lyrics=(validated_data.get("lyrics") or "").strip(),
            genre=(validated_data.get("genre") or "").strip(),
            release_year=validated_data["release_year"],
            duration_seconds=validated_data.get("duration_seconds") or 180,
            is_early_access=validated_data.get("is_early_access", False),
            audio=validated_data["audio"],
            cover=validated_data.get("cover"),
        )
        if featured_ids:
            qs = ArtistProfile.objects.filter(
                id__in=featured_ids,
                status=ArtistStatus.APPROVED,
            ).exclude(pk=artist.pk)
            song.featured_artists.set(qs)
        return song


class AlbumWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    genre = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    release_year = serializers.IntegerField(min_value=1900, max_value=2100)
    cover = serializers.ImageField(required=False, allow_null=True)

    def validate_cover(self, value):
        if value:
            validate_cover_file(value)
        return value

    def create(self, validated_data):
        artist: ArtistProfile = self.context["artist"]
        return Album.objects.create(
            artist=artist,
            title=validated_data["title"].strip(),
            genre=(validated_data.get("genre") or "").strip(),
            release_year=validated_data["release_year"],
            cover=validated_data.get("cover"),
        )


class SongUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False)
    lyrics = serializers.CharField(required=False, allow_blank=True)
    genre = serializers.CharField(max_length=100, required=False, allow_blank=True)
    release_year = serializers.IntegerField(required=False, min_value=1900, max_value=2100)
    duration_seconds = serializers.IntegerField(required=False, min_value=1)
    is_early_access = serializers.BooleanField(required=False)
    featured_artist_ids = serializers.CharField(required=False, allow_blank=True)
    cover = serializers.ImageField(required=False, allow_null=True)
    audio = serializers.FileField(required=False)

    def validate_audio(self, value):
        if value:
            validate_audio_file(value)
        return value

    def validate_cover(self, value):
        if value:
            validate_cover_file(value)
        return value

    def validate_featured_artist_ids(self, value):
        if value is None:
            return None
        if not str(value).strip():
            return []
        ids = []
        for part in str(value).split(","):
            part = part.strip()
            if not part:
                continue
            try:
                ids.append(int(part))
            except ValueError as exc:
                raise serializers.ValidationError("featured_artist_ids must be comma-separated integers.") from exc
        return ids

    def update(self, instance: Song, validated_data):
        featured_ids = validated_data.pop("featured_artist_ids", None)
        for field in (
            "title",
            "lyrics",
            "genre",
            "release_year",
            "duration_seconds",
            "is_early_access",
            "cover",
            "audio",
        ):
            if field in validated_data:
                value = validated_data[field]
                if field in ("title", "lyrics", "genre") and isinstance(value, str):
                    value = value.strip()
                setattr(instance, field, value)
        instance.save()
        if featured_ids is not None:
            qs = ArtistProfile.objects.filter(
                id__in=featured_ids,
                status=ArtistStatus.APPROVED,
            ).exclude(pk=instance.artist_id)
            instance.featured_artists.set(qs)
        return instance


class AlbumUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False)
    genre = serializers.CharField(max_length=100, required=False, allow_blank=True)
    release_year = serializers.IntegerField(required=False, min_value=1900, max_value=2100)
    cover = serializers.ImageField(required=False, allow_null=True)

    def validate_cover(self, value):
        if value:
            validate_cover_file(value)
        return value

    def update(self, instance: Album, validated_data):
        for field, value in validated_data.items():
            if field in ("title", "genre") and isinstance(value, str):
                value = value.strip()
            setattr(instance, field, value)
        instance.save()
        return instance


class ReleaseSerializer(serializers.Serializer):
    """Publish a single or album with multipart tracks."""

    release_type = serializers.ChoiceField(choices=["single", "album"])
    title = serializers.CharField(max_length=200)
    genre = serializers.CharField(max_length=100)
    release_year = serializers.IntegerField(min_value=1900, max_value=2100)
    featured_artist_ids = serializers.CharField(required=False, allow_blank=True, default="")
    cover = serializers.ImageField()
    is_early_access = serializers.BooleanField(required=False, default=False)

    def validate_cover(self, value):
        validate_cover_file(value)
        return value

    def validate_featured_artist_ids(self, value):
        if not value or not str(value).strip():
            return []
        ids = []
        for part in str(value).split(","):
            part = part.strip()
            if not part:
                continue
            try:
                ids.append(int(part))
            except ValueError as exc:
                raise serializers.ValidationError("featured_artist_ids must be comma-separated integers.") from exc
        return ids

    def validate(self, attrs):
        request = self.context["request"]
        tracks = []
        index = 0
        while True:
            title_key = f"track_{index}_title"
            audio_key = f"track_{index}_audio"
            if title_key not in request.data and audio_key not in request.FILES:
                break
            title = (request.data.get(title_key) or "").strip()
            audio = request.FILES.get(audio_key)
            lyrics = (request.data.get(f"track_{index}_lyrics") or "").strip()
            duration_raw = request.data.get(f"track_{index}_duration_seconds") or 180
            try:
                duration = int(duration_raw)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError(
                    {f"track_{index}_duration_seconds": "Must be an integer."}
                ) from exc
            if not title:
                raise serializers.ValidationError({title_key: "Track title is required."})
            if not audio:
                raise serializers.ValidationError({audio_key: "Audio file is required."})
            validate_audio_file(audio)
            if duration < 1:
                raise serializers.ValidationError(
                    {f"track_{index}_duration_seconds": "Duration must be at least 1 second."}
                )
            tracks.append(
                {
                    "title": title,
                    "lyrics": lyrics,
                    "audio": audio,
                    "duration_seconds": duration,
                }
            )
            index += 1

        if not tracks:
            raise serializers.ValidationError({"tracks": "Add at least one track."})
        if attrs["release_type"] == "single" and len(tracks) != 1:
            raise serializers.ValidationError({"tracks": "A single must have exactly one track."})
        attrs["tracks"] = tracks
        return attrs
