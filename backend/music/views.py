from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsApprovedArtist
from music.models import Album
from music.serializers import AlbumSerializer, AlbumWriteSerializer


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
