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
    PlaylistDetailView,
    PlaylistListCreateView,
    PlaylistSongView,
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
    path("playlists/", PlaylistListCreateView.as_view(), name="playlists"),
    path("playlists/<int:pk>/", PlaylistDetailView.as_view(), name="playlists-detail"),
    path("playlists/<int:pk>/songs/", PlaylistSongView.as_view(), name="playlists-songs"),
    path(
        "playlists/<int:pk>/songs/<int:song_id>/",
        PlaylistSongView.as_view(),
        name="playlists-songs-detail",
    ),
    path("me/albums/", ArtistAlbumListCreateView.as_view(), name="me-albums"),
    path("me/albums/<int:pk>/", ArtistAlbumDetailView.as_view(), name="me-albums-detail"),
    path("me/songs/", ArtistSongListCreateView.as_view(), name="me-songs"),
    path("me/songs/<int:pk>/", ArtistSongDetailView.as_view(), name="me-songs-detail"),
]
