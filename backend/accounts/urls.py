from django.urls import path

from accounts.views import (
    ApproveArtistView,
    ArtistDetailView,
    ArtistRegisterView,
    FollowArtistView,
    FollowUserView,
    LoginView,
    LogoutView,
    MeSettingsView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PendingArtistListView,
    RegisterListenerView,
    RejectArtistView,
    UserDetailView,
    UserFollowCountsView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterListenerView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path(
        "auth/password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    # Users
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/settings/", MeSettingsView.as_view(), name="users-me-settings"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="users-detail"),
    path("users/<int:pk>/follow/", FollowUserView.as_view(), name="users-follow"),
    path(
        "users/<int:pk>/follow-counts/",
        UserFollowCountsView.as_view(),
        name="users-follow-counts",
    ),
    # Artists
    path("artists/register/", ArtistRegisterView.as_view(), name="artists-register"),
    path("artists/pending/", PendingArtistListView.as_view(), name="artists-pending"),
    path("artists/<int:pk>/", ArtistDetailView.as_view(), name="artists-detail"),
    path("artists/<int:pk>/approve/", ApproveArtistView.as_view(), name="artists-approve"),
    path("artists/<int:pk>/reject/", RejectArtistView.as_view(), name="artists-reject"),
    path("artists/<int:pk>/follow/", FollowArtistView.as_view(), name="artists-follow"),
]
