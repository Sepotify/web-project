from django.urls import path

from music.views import (
    AlbumCatalogView,
    AlbumDetailView,
    ArtistAlbumDetailView,
    ArtistAlbumListCreateView,
    ArtistSongDetailView,
    ArtistSongListCreateView,
    ArtistWorksView,
    HomeFeedView,
    SongCatalogView,
    SongDetailView,
)

urlpatterns = [
    path("home/", HomeFeedView.as_view(), name="home-feed"),
    path("albums/", AlbumCatalogView.as_view(), name="albums-catalog"),
    path("albums/<int:pk>/", AlbumDetailView.as_view(), name="albums-detail"),
    path("songs/", SongCatalogView.as_view(), name="songs-catalog"),
    path("songs/<int:pk>/", SongDetailView.as_view(), name="songs-detail"),
    path("artists/<int:pk>/works/", ArtistWorksView.as_view(), name="artists-works"),
    path("me/albums/", ArtistAlbumListCreateView.as_view(), name="me-albums"),
    path("me/albums/<int:pk>/", ArtistAlbumDetailView.as_view(), name="me-albums-detail"),
    path("me/songs/", ArtistSongListCreateView.as_view(), name="me-songs"),
    path("me/songs/<int:pk>/", ArtistSongDetailView.as_view(), name="me-songs-detail"),
]
