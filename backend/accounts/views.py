from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistProfile, ArtistStatus, User, UserSettings
from accounts.permissions import IsSupportOrAdmin
from accounts.serializers import (
    ArtistProfileSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterArtistSerializer,
    RegisterListenerSerializer,
    RejectArtistSerializer,
    UserMeSerializer,
    UserMeUpdateSerializer,
    UserPublicSerializer,
    UserSettingsSerializer,
)
from accounts.services import (
    approve_artist,
    follow_artist,
    follow_user,
    reject_artist,
    unfollow_artist,
    unfollow_user,
)
from notifications.services import notify_artist_approval, notify_artist_rejection


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterListenerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterListenerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "user": UserMeSerializer(user, context={"request": request}).data,
                "tokens": _tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(
            {
                "user": UserMeSerializer(user, context={"request": request}).data,
                "tokens": _tokens_for_user(user),
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset = serializer.create_token()
        if reset is None:
            return Response(
                {"detail": "No account found with this email."},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Academic project: return token so it can be used without email infra.
        return Response(
            {
                "detail": "Password reset token created.",
                "token": reset.token,
                "expires_at": reset.expires_at,
            }
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password has been reset."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserMeSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = UserMeUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserMeSerializer(request.user, context={"request": request}).data)

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserPublicSerializer
    queryset = User.objects.filter(is_active=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MeSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.request.user)
        return settings_obj

    def get(self, request):
        return Response(UserSettingsSerializer(self.get_object()).data)

    def patch(self, request):
        settings_obj = self.get_object()
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSettingsSerializer(settings_obj).data)


class FollowUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        target = get_object_or_404(User, pk=pk, is_active=True)
        ok, message = follow_user(request.user, target)
        code = status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST
        return Response(
            {
                "success": ok,
                "detail": message,
                "follower_count": target.followers.count(),
                "following_count": request.user.following_users.count()
                + request.user.following_artists.count(),
            },
            status=code,
        )

    def delete(self, request, pk):
        target = get_object_or_404(User, pk=pk, is_active=True)
        ok, message = unfollow_user(request.user, target)
        code = status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST
        return Response({"success": ok, "detail": message}, status=code)


class UserFollowCountsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        return Response(
            {
                "user_id": user.pk,
                "follower_count": user.followers.count(),
                "following_user_count": user.following_users.count(),
                "following_artist_count": user.following_artists.count(),
                "following_count": user.following_users.count()
                + user.following_artists.count(),
            }
        )


class ArtistRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterArtistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        user = result["user"]
        artist = result["artist"]
        return Response(
            {
                "user": UserMeSerializer(user, context={"request": request}).data,
                "artist": ArtistProfileSerializer(artist).data,
                "tokens": _tokens_for_user(user),
            },
            status=status.HTTP_201_CREATED,
        )


class PendingArtistListView(generics.ListAPIView):
    permission_classes = [IsSupportOrAdmin]
    serializer_class = ArtistProfileSerializer

    def get_queryset(self):
        return ArtistProfile.objects.filter(status=ArtistStatus.PENDING).select_related(
            "user"
        )


class ArtistDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ArtistProfileSerializer
    queryset = ArtistProfile.objects.select_related("user")


class ApproveArtistView(APIView):
    permission_classes = [IsSupportOrAdmin]

    def post(self, request, pk):
        artist = get_object_or_404(ArtistProfile, pk=pk)
        if artist.status == ArtistStatus.APPROVED:
            return Response(
                {"detail": "Artist is already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approve_artist(artist)
        notify_artist_approval(artist)
        return Response(ArtistProfileSerializer(artist).data)


class RejectArtistView(APIView):
    permission_classes = [IsSupportOrAdmin]

    def post(self, request, pk):
        artist = get_object_or_404(ArtistProfile, pk=pk)
        serializer = RejectArtistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reject_artist(artist, serializer.validated_data["reason"])
        notify_artist_rejection(artist)
        return Response(ArtistProfileSerializer(artist).data)


class FollowArtistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        artist = get_object_or_404(ArtistProfile, pk=pk)
        ok, message = follow_artist(request.user, artist)
        code = status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST
        return Response(
            {
                "success": ok,
                "detail": message,
                "follower_count": artist.followers.count(),
            },
            status=code,
        )

    def delete(self, request, pk):
        artist = get_object_or_404(ArtistProfile, pk=pk)
        ok, message = unfollow_artist(request.user, artist)
        code = status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST
        return Response({"success": ok, "detail": message}, status=code)
