from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsApprovedArtist
from music.models import Album, Song
from music.serializers import (
    AlbumSerializer,
    AlbumWriteSerializer,
    SongSerializer,
    SongWriteSerializer,
)
from music.services import apply_catalog_search, apply_catalog_sort


def _artist_profile(request):
    return request.user.artist_profile


class ArtistAlbumListCreateView(APIView):
    """List and create albums owned by the approved artist."""

    permission_classes = [IsApprovedArtist]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        albums = Album.objects.filter(artist=_artist_profile(request)).select_related("artist")
        return Response(
            AlbumSerializer(albums, many=True, context={"request": request}).data
        )

    def post(self, request):
        serializer = AlbumWriteSerializer(
            data=request.data,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        album = serializer.save()
        return Response(
            AlbumSerializer(album, context={"request": request}).data,
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
        return Response(AlbumSerializer(album, context={"request": request}).data)

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
        return Response(AlbumSerializer(album, context={"request": request}).data)

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
            SongSerializer(songs, many=True, context={"request": request}).data
        )

    def post(self, request):
        serializer = SongWriteSerializer(
            data=request.data,
            context={"request": request, "artist": _artist_profile(request)},
        )
        serializer.is_valid(raise_exception=True)
        song = serializer.save()
        return Response(
            SongSerializer(song, context={"request": request}).data,
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
        return Response(SongSerializer(song, context={"request": request}).data)

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
        return Response(SongSerializer(song, context={"request": request}).data)

    def delete(self, request, pk):
        song = self.get_object(request, pk)
        song.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AlbumCatalogView(generics.ListAPIView):
    """Search and sort published albums by title or artist name."""

    permission_classes = [IsAuthenticated]
    serializer_class = AlbumSerializer

    def get_queryset(self):
        queryset = Album.objects.select_related("artist")
        queryset = apply_catalog_search(queryset, self.request.query_params.get("q", ""))
        return apply_catalog_sort(queryset, self.request.query_params.get("sort", ""))


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
        queryset = apply_catalog_search(queryset, self.request.query_params.get("q", ""))
        return apply_catalog_sort(queryset, self.request.query_params.get("sort", ""))
