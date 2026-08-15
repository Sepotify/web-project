from django.urls import path

from music.views import (
    ArtistAlbumDetailView,
    ArtistAlbumListCreateView,
    ArtistSongDetailView,
    ArtistSongListCreateView,
)

urlpatterns = [
    path("me/albums/", ArtistAlbumListCreateView.as_view(), name="me-albums"),
    path("me/albums/<int:pk>/", ArtistAlbumDetailView.as_view(), name="me-albums-detail"),
    path("me/songs/", ArtistSongListCreateView.as_view(), name="me-songs"),
    path("me/songs/<int:pk>/", ArtistSongDetailView.as_view(), name="me-songs-detail"),
]
