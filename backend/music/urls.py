from django.urls import path

from music.views import ArtistAlbumDetailView, ArtistAlbumListCreateView

urlpatterns = [
    path("me/albums/", ArtistAlbumListCreateView.as_view(), name="me-albums"),
    path("me/albums/<int:pk>/", ArtistAlbumDetailView.as_view(), name="me-albums-detail"),
]
