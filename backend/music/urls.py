from django.urls import path

from music.views import (
    AlbumCatalogView,
    ArtistAlbumDetailView,
    ArtistAlbumListCreateView,
    ArtistSongDetailView,
    ArtistSongListCreateView,
    SongCatalogView,
)

urlpatterns = [
    path("albums/", AlbumCatalogView.as_view(), name="albums-catalog"),
    path("songs/", SongCatalogView.as_view(), name="songs-catalog"),
    path("me/albums/", ArtistAlbumListCreateView.as_view(), name="me-albums"),
    path("me/albums/<int:pk>/", ArtistAlbumDetailView.as_view(), name="me-albums-detail"),
    path("me/songs/", ArtistSongListCreateView.as_view(), name="me-songs"),
    path("me/songs/<int:pk>/", ArtistSongDetailView.as_view(), name="me-songs-detail"),
]
