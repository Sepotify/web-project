from pathlib import Path

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ArtistProfile, ArtistStatus
from accounts.permissions import HasSubscriptionCapability, IsApprovedArtist
from music.models import Album, Playlist, Song
from music.serializers import (
    AlbumDetailSerializer,
    AlbumSerializer,
    AlbumWriteSerializer,
    ArtistWorksSerializer,
    PlaylistDetailSerializer,
    PlaylistSerializer,
    PlaylistSongWriteSerializer,
    PlaylistWriteSerializer,
    SongSerializer,
    SongWriteSerializer,
)
from music.services import (
    add_song_to_playlist,
    apply_catalog_search,
    apply_catalog_sort,
    can_create_user_playlist,
    get_home_feed,
    record_stream,
    remove_song_from_playlist,
    visible_songs_for_user,
)
from subscriptions.services import can_early_access, can_stream_now


def _artist_profile(request):
    return request.user.artist_profile


class ArtistAlbumListCreateView(APIView):
    """List and create albums owned by the approved artist."""

    permission_classes = [IsApprovedArtist]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        albums = Album.objects.filter(artist=_artist_profile(request)).select_related("artist")
        return Response(
            AlbumSerializer(
                albums,
                many=True,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    @extend_schema(
        request=AlbumWriteSerializer,
        responses={201: AlbumSerializer},
        description="Create an album. Send cover as multipart/form-data (JPG/PNG/WebP, max 2 MB).",
    )
    def post(self, request):
        serializer = AlbumWriteSerializer(
            data=request.data,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        album = serializer.save()
        return Response(
            AlbumSerializer(
                album,
                context={"request": request, "reveal_restricted": True},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ArtistAlbumDetailView(APIView):
    """Retrieve, update, or delete an album owned by the approved artist."""

    permission_classes = [IsApprovedArtist]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, request, pk):
        return get_object_or_404(Album, pk=pk, artist=_artist_profile(request))

    def get(self, request, pk):
        album = self.get_object(request, pk)
        return Response(
            AlbumSerializer(
                album,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    def patch(self, request, pk):
        album = self.get_object(request, pk)
        serializer = AlbumWriteSerializer(
            album,
            data=request.data,
            partial=True,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        album = serializer.save()
        return Response(
            AlbumSerializer(
                album,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    def delete(self, request, pk):
        album = self.get_object(request, pk)
        album.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArtistSongListCreateView(APIView):
    """List and upload songs owned by the approved artist."""

    permission_classes = [IsApprovedArtist]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        songs = (
            Song.objects.filter(artist=_artist_profile(request))
            .select_related("artist", "album")
            .prefetch_related("featured_artists")
        )
        return Response(
            SongSerializer(
                songs,
                many=True,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    @extend_schema(
        request=SongWriteSerializer,
        responses={201: SongSerializer},
        description=(
            "Upload a song as multipart/form-data. "
            "audio is required (MP3/WAV/FLAC, max 8 MB). "
            "Optional: cover, lyrics, genre, release_year, album, "
            "featured_artist_ids, duration_seconds, is_early_access."
        ),
    )
    def post(self, request):
        serializer = SongWriteSerializer(
            data=request.data,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        song = serializer.save()
        return Response(
            SongSerializer(
                song,
                context={"request": request, "reveal_restricted": True},
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ArtistSongDetailView(APIView):
    """Retrieve, update, or delete a song owned by the approved artist."""

    permission_classes = [IsApprovedArtist]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, request, pk):
        return get_object_or_404(Song, pk=pk, artist=_artist_profile(request))

    def get(self, request, pk):
        song = self.get_object(request, pk)
        return Response(
            SongSerializer(
                song,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    def patch(self, request, pk):
        song = self.get_object(request, pk)
        serializer = SongWriteSerializer(
            song,
            data=request.data,
            partial=True,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        song = serializer.save()
        return Response(
            SongSerializer(
                song,
                context={"request": request, "reveal_restricted": True},
            ).data
        )

    def delete(self, request, pk):
        song = self.get_object(request, pk)
        song.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    parameters=[
        OpenApiParameter(name="q", description="Search title or artist name"),
        OpenApiParameter(
            name="sort",
            description="newest | oldest | most_listeners | most_streams | title_asc",
        ),
    ]
)
class AlbumCatalogView(generics.ListAPIView):
    """Search and sort published albums by title or artist name."""

    permission_classes = [IsAuthenticated]
    serializer_class = AlbumSerializer

    def get_queryset(self):
        queryset = Album.objects.select_related("artist")
        queryset = apply_catalog_search(queryset, self.request.query_params.get("q", ""))
        return apply_catalog_sort(queryset, self.request.query_params.get("sort", ""))


@extend_schema(
    parameters=[
        OpenApiParameter(name="q", description="Search title or artist name"),
        OpenApiParameter(
            name="sort",
            description="newest | oldest | most_listeners | most_streams | title_asc",
        ),
        OpenApiParameter(name="singles_only", description="true to hide album tracks"),
    ]
)
class SongCatalogView(generics.ListAPIView):
    """Search and sort published songs by title or artist name."""

    permission_classes = [IsAuthenticated]
    serializer_class = SongSerializer

    def get_queryset(self):
        queryset = Song.objects.select_related("artist", "album").prefetch_related(
            "featured_artists"
        )
        if self.request.query_params.get("singles_only") in {"1", "true", "yes"}:
            queryset = queryset.filter(album__isnull=True)
        queryset = visible_songs_for_user(queryset, self.request.user)
        queryset = apply_catalog_search(queryset, self.request.query_params.get("q", ""))
        return apply_catalog_sort(queryset, self.request.query_params.get("sort", ""))


class AlbumDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AlbumDetailSerializer

    def get_queryset(self):
        return (
            Album.objects.filter(artist__status=ArtistStatus.APPROVED)
            .select_related("artist")
            .prefetch_related("songs__artist", "songs__album", "songs__featured_artists")
        )


class SongDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SongSerializer

    def get_queryset(self):
        return (
            visible_songs_for_user(
                Song.objects.filter(artist__status=ArtistStatus.APPROVED)
                .select_related("artist", "album")
                .prefetch_related("featured_artists"),
                self.request.user,
            )
        )


class SongStreamView(APIView):
    """Register a play and enforce the daily stream cap from Person 1."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        allowed, message = can_stream_now(request.user)
        if not allowed:
            return Response({"detail": message}, status=status.HTTP_403_FORBIDDEN)

        song = get_object_or_404(
            Song.objects.select_related("artist", "album"),
            pk=pk,
            artist__status=ArtistStatus.APPROVED,
        )
        event, error = record_stream(request.user, song)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Stream recorded.",
                "stream_event_id": event.pk,
                "daily_stream_count": request.user.daily_stream_count,
                "song": SongSerializer(song, context={"request": request}).data,
            }
        )


class SongDownloadView(APIView):
    """Download a track. Silver and gold only (Person 1 can_download)."""

    permission_classes = [IsAuthenticated, HasSubscriptionCapability]
    required_capability = "can_download"

    def get(self, request, pk):
        song = get_object_or_404(
            Song.objects.select_related("artist"),
            pk=pk,
            artist__status=ArtistStatus.APPROVED,
        )
        if song.is_early_access and not can_early_access(request.user):
            return Response(
                {"detail": "This early-access track is only available on the gold plan."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not song.audio:
            return Response(
                {"detail": "Audio file is not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = Path(song.audio.name).name
        return FileResponse(song.audio.open("rb"), as_attachment=True, filename=filename)


class ArtistWorksView(APIView):
    """Public artist profile discography: bio, verified badge, albums, and singles."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        artist = get_object_or_404(
            ArtistProfile.objects.select_related("user"),
            pk=pk,
            status=ArtistStatus.APPROVED,
        )
        return Response(
            ArtistWorksSerializer(artist, context={"request": request}).data
        )


class HomeFeedView(APIView):
    """Home shelves: recent playlists, latest albums, and popular songs."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        feed = get_home_feed(request.user)
        context = {"request": request}
        return Response(
            {
                "recent_playlists": PlaylistSerializer(
                    feed["recent_playlists"], many=True, context=context
                ).data,
                "latest_albums": AlbumSerializer(
                    feed["latest_albums"], many=True, context=context
                ).data,
                "popular_songs": SongSerializer(
                    feed["popular_songs"], many=True, context=context
                ).data,
                "early_access_songs": SongSerializer(
                    feed["early_access_songs"], many=True, context=context
                ).data,
            }
        )


class PlaylistListCreateView(APIView):
    """List and create playlists owned by the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        playlists = Playlist.objects.filter(user=request.user)
        return Response(
            PlaylistSerializer(playlists, many=True, context={"request": request}).data
        )

    def post(self, request):
        allowed, message = can_create_user_playlist(request.user)
        if not allowed:
            return Response({"detail": message}, status=status.HTTP_403_FORBIDDEN)

        serializer = PlaylistWriteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        playlist = serializer.save()
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PlaylistDetailView(APIView):
    """Retrieve, rename, or delete a playlist owned by the current user."""

    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(Playlist, pk=pk, user=request.user)

    def get(self, request, pk):
        playlist = self.get_object(request, pk)
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data
        )

    def patch(self, request, pk):
        playlist = self.get_object(request, pk)
        serializer = PlaylistWriteSerializer(
            playlist,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        playlist = serializer.save()
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data
        )

    def delete(self, request, pk):
        playlist = self.get_object(request, pk)
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaylistSongView(APIView):
    """Add or remove a song on a playlist owned by the current user."""

    permission_classes = [IsAuthenticated]

    def get_playlist(self, request, pk):
        return get_object_or_404(Playlist, pk=pk, user=request.user)

    def post(self, request, pk):
        playlist = self.get_playlist(request, pk)
        serializer = PlaylistSongWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        song = get_object_or_404(
            Song,
            pk=serializer.validated_data["song_id"],
            artist__status=ArtistStatus.APPROVED,
        )
        ok, message = add_song_to_playlist(playlist, song, request.user)
        if not ok:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        playlist.refresh_from_db()
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk, song_id):
        playlist = self.get_playlist(request, pk)
        song = get_object_or_404(Song, pk=song_id)
        ok, message = remove_song_from_playlist(playlist, song)
        if not ok:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
        playlist.refresh_from_db()
        return Response(
            PlaylistDetailSerializer(playlist, context={"request": request}).data
        )
