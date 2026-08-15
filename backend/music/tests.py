from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from music.models import Song
from subscriptions.models import PricingConfig, Subscription, SubscriptionTier


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
