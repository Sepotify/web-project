from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ArtistProfile, ArtistStatus
from accounts.permissions import IsApprovedArtist
from catalog.models import Album, Song
from catalog.serializers import (
    AlbumSerializer,
    AlbumUpdateSerializer,
    AlbumWriteSerializer,
    ReleaseSerializer,
    SongSerializer,
    SongUpdateSerializer,
    SongWriteSerializer,
)
from catalog.services import notify_followers_of_new_release


def _artist_profile(user) -> ArtistProfile | None:
    profile = getattr(user, "artist_profile", None)
    if profile and profile.status == ArtistStatus.APPROVED:
        return profile
    return None


class SongListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsApprovedArtist()]

    def get(self, request):
        qs = Song.objects.select_related("artist", "album").prefetch_related("featured_artists")
        artist_id = request.query_params.get("artist_id")
        if artist_id:
            qs = qs.filter(artist_id=artist_id)
        return Response(
            {
                "count": qs.count(),
                "results": SongSerializer(qs, many=True, context={"request": request}).data,
            }
        )

    def post(self, request):
        artist = _artist_profile(request.user)
        serializer = SongWriteSerializer(
            data=request.data,
            context={"request": request, "artist": artist},
        )
        serializer.is_valid(raise_exception=True)
        song = serializer.save()
        notify_followers_of_new_release(
            artist,
            title=song.title,
            link=f"/albums/{song.album_id}" if song.album_id else f"/songs/{song.pk}",
            release_label="track" if song.album_id else "single",
        )
        return Response(
            SongSerializer(song, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SongDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsApprovedArtist()]

    def get_object(self, pk):
        return get_object_or_404(
            Song.objects.select_related("artist", "album").prefetch_related("featured_artists"),
            pk=pk,
        )

    def get(self, request, pk):
        song = self.get_object(pk)
        return Response(SongSerializer(song, context={"request": request}).data)

    def patch(self, request, pk):
        song = self.get_object(pk)
        artist = _artist_profile(request.user)
        if not artist or song.artist_id != artist.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SongUpdateSerializer(song, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        song = serializer.save()
        return Response(SongSerializer(song, context={"request": request}).data)

    def delete(self, request, pk):
        song = self.get_object(pk)
        artist = _artist_profile(request.user)
        if not artist or song.artist_id != artist.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        song.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AlbumListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsApprovedArtist()]

    def get(self, request):
        qs = Album.objects.select_related("artist").prefetch_related("songs")
        artist_id = request.query_params.get("artist_id")
        if artist_id:
            qs = qs.filter(artist_id=artist_id)
        return Response(
            {
                "count": qs.count(),
                "results": AlbumSerializer(qs, many=True, context={"request": request}).data,
            }
        )

    def post(self, request):
        artist = _artist_profile(request.user)
        serializer = AlbumWriteSerializer(
            data=request.data,
            context={"request": request, "artist": artist},
        )
        serializer.is_valid(raise_exception=True)
        album = serializer.save()
        return Response(
            AlbumSerializer(album, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class AlbumDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsApprovedArtist()]

    def get_object(self, pk):
        return get_object_or_404(
            Album.objects.select_related("artist").prefetch_related("songs", "songs__featured_artists"),
            pk=pk,
        )

    def get(self, request, pk):
        album = self.get_object(pk)
        return Response(AlbumSerializer(album, context={"request": request}).data)

    def patch(self, request, pk):
        album = self.get_object(pk)
        artist = _artist_profile(request.user)
        if not artist or album.artist_id != artist.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AlbumUpdateSerializer(album, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        album = serializer.save()
        return Response(AlbumSerializer(album, context={"request": request}).data)

    def delete(self, request, pk):
        album = self.get_object(pk)
        artist = _artist_profile(request.user)
        if not artist or album.artist_id != artist.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        album.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyWorksView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedArtist]

    def get(self, request):
        artist = _artist_profile(request.user)
        albums = Album.objects.filter(artist=artist).prefetch_related("songs")
        songs = Song.objects.filter(artist=artist).select_related("album")
        return Response(
            {
                "artist_id": artist.id,
                "albums": AlbumSerializer(albums, many=True, context={"request": request}).data,
                "songs": SongSerializer(songs, many=True, context={"request": request}).data,
            }
        )


class ReleaseCreateView(APIView):
    """
    Multipart publish matching the Phase 1 artist-works form.

    Fields: release_type, title, genre, release_year, cover,
            featured_artist_ids (optional), is_early_access (optional),
            track_N_title, track_N_audio, track_N_lyrics, track_N_duration_seconds
    """

    permission_classes = [IsAuthenticated, IsApprovedArtist]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        artist = _artist_profile(request.user)
        serializer = ReleaseSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        featured_ids = data["featured_artist_ids"]
        tracks = data["tracks"]

        album = None
        if data["release_type"] == "album":
            album = Album.objects.create(
                artist=artist,
                title=data["title"].strip(),
                genre=data["genre"].strip(),
                release_year=data["release_year"],
                cover=data["cover"],
            )

        created_songs = []
        for track in tracks:
            song_title = data["title"].strip() if data["release_type"] == "single" else track["title"]
            song = Song.objects.create(
                artist=artist,
                album=album,
                title=song_title,
                lyrics=track["lyrics"],
                genre=data["genre"].strip(),
                release_year=data["release_year"],
                cover=data["cover"] if data["release_type"] == "single" else None,
                audio=track["audio"],
                duration_seconds=track["duration_seconds"],
                is_early_access=data.get("is_early_access", False),
            )
            if featured_ids:
                from accounts.models import ArtistProfile as AP

                qs = AP.objects.filter(id__in=featured_ids, status=ArtistStatus.APPROVED).exclude(
                    pk=artist.pk
                )
                song.featured_artists.set(qs)
            created_songs.append(song)

        if data["release_type"] == "album":
            notify_followers_of_new_release(
                artist,
                title=album.title,
                link=f"/albums/{album.pk}",
                release_label="album",
            )
            return Response(
                {
                    "album": AlbumSerializer(album, context={"request": request}).data,
                    "songs": SongSerializer(created_songs, many=True, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )

        song = created_songs[0]
        notify_followers_of_new_release(
            artist,
            title=song.title,
            link=f"/songs/{song.pk}",
            release_label="single",
        )
        return Response(
            {"song": SongSerializer(song, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )
