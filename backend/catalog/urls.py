from django.urls import path

from catalog.views import (
    AlbumDetailView,
    AlbumListCreateView,
    MyWorksView,
    ReleaseCreateView,
    SongDetailView,
    SongListCreateView,
)

urlpatterns = [
    path("songs/", SongListCreateView.as_view(), name="songs-list-create"),
    path("songs/<int:pk>/", SongDetailView.as_view(), name="songs-detail"),
    path("albums/", AlbumListCreateView.as_view(), name="albums-list-create"),
    path("albums/<int:pk>/", AlbumDetailView.as_view(), name="albums-detail"),
    path("artists/me/works/", MyWorksView.as_view(), name="artists-me-works"),
    path("releases/", ReleaseCreateView.as_view(), name="releases-create"),
]
