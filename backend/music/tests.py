from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone

from accounts.models import ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from music.models import Song
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier
from subscriptions.services import set_user_tier


class Person2PublishTests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def _make_artist(self, *, email, status, username):
        user = User.objects.create_user(
            email=email,
            password="secret1",
            username=username,
            display_name=username,
            role=UserRole.ARTIST,
        )
        UserSettings.objects.create(user=user)
        Subscription.objects.create(user=user, tier=SubscriptionTier.BASIC)
        artist = ArtistProfile.objects.create(
            user=user,
            stage_name=username.replace("_", " ").title(),
            portfolio="portfolio sample works here",
            status=status,
            is_verified=(status == ArtistStatus.APPROVED),
        )
        return user, artist

    def _mp3(self, name="track.mp3"):
        return SimpleUploadedFile(name, b"ID3fake-audio", content_type="audio/mpeg")

    def test_approved_artist_can_publish_song(self):
        """Approved artists can upload a single with audio and metadata."""
        user, artist = self._make_artist(
            email="nova@example.com",
            status=ArtistStatus.APPROVED,
            username="nova_waves",
        )
        self._auth(user)

        response = self.client.post(
            reverse("me-songs"),
            {
                "title": "Midnight Drive",
                "genre": "synthwave",
                "release_year": 2026,
                "lyrics": "City lights in the rearview.",
                "duration_seconds": 214,
                "audio": self._mp3(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["title"], "Midnight Drive")
        self.assertEqual(response.data["artist_id"], artist.pk)
        self.assertIsNone(response.data["album_id"])
        self.assertTrue(response.data["audio_url"])
        self.assertTrue(Song.objects.filter(artist=artist, title="Midnight Drive").exists())

    def test_pending_artist_cannot_publish(self):
        """Pending artists are blocked from publishing albums or songs."""
        user, _ = self._make_artist(
            email="pending@example.com",
            status=ArtistStatus.PENDING,
            username="pending_artist",
        )
        self._auth(user)

        album = self.client.post(
            reverse("me-albums"),
            {"title": "Unreleased", "genre": "pop", "release_year": 2026},
            format="multipart",
        )
        self.assertEqual(album.status_code, status.HTTP_403_FORBIDDEN)

        song = self.client.post(
            reverse("me-songs"),
            {"title": "Demo", "audio": self._mp3()},
            format="multipart",
        )
        self.assertEqual(song.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Song.objects.count(), 0)

    def test_invalid_audio_format_rejected(self):
        """Uploading a non MP3/WAV/FLAC file is rejected."""
        user, _ = self._make_artist(
            email="valid@example.com",
            status=ArtistStatus.APPROVED,
            username="valid_artist",
        )
        self._auth(user)

        response = self.client.post(
            reverse("me-songs"),
            {
                "title": "Bad File",
                "audio": SimpleUploadedFile(
                    "notes.txt",
                    b"this is not audio",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("audio", response.data)
        self.assertEqual(Song.objects.count(), 0)


class Person2LimitTests(APITestCase):
    def setUp(self):
        PricingConfig.get_solo()

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def _make_listener(self, *, email, username, tier=SubscriptionTier.BASIC):
        user = User.objects.create_user(
            email=email,
            password="secret1",
            username=username,
            display_name=username,
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=user)
        Subscription.objects.create(user=user, tier=tier)
        return user

    def _make_song(self):
        artist_user = User.objects.create_user(
            email="artist@example.com",
            password="secret1",
            username="approved_artist",
            display_name="Approved Artist",
            role=UserRole.ARTIST,
        )
        UserSettings.objects.create(user=artist_user)
        Subscription.objects.create(user=artist_user, tier=SubscriptionTier.BASIC)
        artist = ArtistProfile.objects.create(
            user=artist_user,
            stage_name="Approved Artist",
            portfolio="portfolio sample works here",
            status=ArtistStatus.APPROVED,
            is_verified=True,
        )
        return Song.objects.create(
            title="Playable Track",
            artist=artist,
            audio=SimpleUploadedFile("play.mp3", b"ID3fake-audio", content_type="audio/mpeg"),
            duration_seconds=180,
        )

    def test_basic_playlist_limit(self):
        """Basic users cannot create more than 6 playlists."""
        user = self._make_listener(email="basic@example.com", username="basic_listener")
        self._auth(user)

        for index in range(6):
            created = self.client.post(
                reverse("playlists"),
                {"name": f"Mix {index}"},
                format="json",
            )
            self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.data)

        blocked = self.client.post(
            reverse("playlists"),
            {"name": "One too many"},
            format="json",
        )
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("6-playlist limit", blocked.data["detail"])

        set_user_tier(user, SubscriptionTier.GOLD)
        allowed = self.client.post(
            reverse("playlists"),
            {"name": "Gold extra"},
            format="json",
        )
        self.assertEqual(allowed.status_code, status.HTTP_201_CREATED, allowed.data)

    def test_basic_daily_stream_limit(self):
        """Basic users are stopped after 60 streams in a day."""
        user = self._make_listener(email="streamer@example.com", username="streamer")
        song = self._make_song()
        self._auth(user)

        first = self.client.post(reverse("songs-stream", kwargs={"pk": song.pk}))
        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)
        self.assertEqual(first.data["daily_stream_count"], 1)

        user.daily_stream_count = 60
        user.daily_stream_reset_date = timezone.localdate()
        user.save(update_fields=["daily_stream_count", "daily_stream_reset_date"])

        blocked = self.client.post(reverse("songs-stream", kwargs={"pk": song.pk}))
        self.assertEqual(blocked.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Daily stream limit of 60", blocked.data["detail"])
        song.refresh_from_db()
        self.assertEqual(song.stream_count, 1)
