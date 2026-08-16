from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistFollow, ArtistProfile, ArtistStatus, User, UserRole, UserSettings
from catalog.models import Album, Song
from notifications.models import Notification, NotificationType


def _tiny_png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color=(20, 20, 20)).save(buffer, format="PNG")
    return buffer.getvalue()


def _fake_mp3() -> bytes:
    return b"ID3" + b"\x00" * 64


class CatalogAPITests(APITestCase):
    def setUp(self):
        self.listener = User.objects.create_user(
            email="listener@test.com",
            password="Pass1234",
            username="listener",
            display_name="Listener",
            role=UserRole.LISTENER,
        )
        UserSettings.objects.create(user=self.listener)

        self.artist_user = User.objects.create_user(
            email="artist@test.com",
            password="Pass1234",
            username="artist",
            display_name="Artist",
            role=UserRole.ARTIST,
        )
        UserSettings.objects.create(user=self.artist_user)
        self.artist = ArtistProfile.objects.create(
            user=self.artist_user,
            stage_name="Nova",
            portfolio="demo",
            status=ArtistStatus.APPROVED,
            is_verified=True,
        )

        self.pending_user = User.objects.create_user(
            email="pending@test.com",
            password="Pass1234",
            username="pending",
            display_name="Pending",
            role=UserRole.ARTIST,
        )
        UserSettings.objects.create(user=self.pending_user)
        self.pending_artist = ArtistProfile.objects.create(
            user=self.pending_user,
            stage_name="Pending Act",
            portfolio="demo",
            status=ArtistStatus.PENDING,
        )

        ArtistFollow.objects.create(follower=self.listener, artist=self.artist)

    def _auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def _cover(self):
        return SimpleUploadedFile("cover.png", _tiny_png(), content_type="image/png")

    def _audio(self, name="track.mp3"):
        return SimpleUploadedFile(name, _fake_mp3(), content_type="audio/mpeg")

    def test_approved_artist_can_publish_single(self):
        self._auth(self.artist_user)
        res = self.client.post(
            reverse("releases-create"),
            {
                "release_type": "single",
                "title": "Midnight Drive",
                "genre": "Electronic",
                "release_year": 2026,
                "cover": self._cover(),
                "track_0_title": "Midnight Drive",
                "track_0_lyrics": "go",
                "track_0_audio": self._audio(),
                "track_0_duration_seconds": 200,
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn("song", res.data)
        self.assertEqual(Song.objects.count(), 1)
        self.assertTrue(
            Notification.objects.filter(
                user=self.listener,
                type=NotificationType.NEW_RELEASE,
            ).exists()
        )

    def test_pending_artist_cannot_publish(self):
        self._auth(self.pending_user)
        res = self.client.post(
            reverse("releases-create"),
            {
                "release_type": "single",
                "title": "Nope",
                "genre": "Pop",
                "release_year": 2026,
                "cover": self._cover(),
                "track_0_title": "Nope",
                "track_0_audio": self._audio(),
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejects_invalid_audio_extension(self):
        self._auth(self.artist_user)
        bad = SimpleUploadedFile("track.txt", b"not audio", content_type="text/plain")
        res = self.client.post(
            reverse("songs-list-create"),
            {
                "title": "Bad",
                "genre": "Pop",
                "release_year": 2026,
                "audio": bad,
                "cover": self._cover(),
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_artist_can_create_album_and_list_own_works(self):
        self._auth(self.artist_user)
        album_res = self.client.post(
            reverse("albums-list-create"),
            {
                "title": "First LP",
                "genre": "Rock",
                "release_year": 2025,
                "cover": self._cover(),
            },
            format="multipart",
        )
        self.assertEqual(album_res.status_code, status.HTTP_201_CREATED, album_res.data)
        album_id = album_res.data["id"]

        song_res = self.client.post(
            reverse("songs-list-create"),
            {
                "title": "Opener",
                "genre": "Rock",
                "release_year": 2025,
                "album_id": album_id,
                "audio": self._audio(),
                "cover": self._cover(),
                "duration_seconds": 210,
            },
            format="multipart",
        )
        self.assertEqual(song_res.status_code, status.HTTP_201_CREATED, song_res.data)

        works = self.client.get(reverse("artists-me-works"))
        self.assertEqual(works.status_code, status.HTTP_200_OK)
        self.assertEqual(len(works.data["albums"]), 1)
        self.assertEqual(len(works.data["songs"]), 1)

    def test_public_song_list_and_owner_delete(self):
        song = Song.objects.create(
            artist=self.artist,
            title="Public Track",
            genre="Jazz",
            release_year=2024,
            audio=SimpleUploadedFile("a.mp3", _fake_mp3(), content_type="audio/mpeg"),
            cover=SimpleUploadedFile("c.png", _tiny_png(), content_type="image/png"),
            duration_seconds=120,
        )

        listed = self.client.get(reverse("songs-list-create"))
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(listed.data["count"], 1)

        self._auth(self.listener)
        denied = self.client.delete(reverse("songs-detail", kwargs={"pk": song.pk}))
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

        self._auth(self.artist_user)
        deleted = self.client.delete(reverse("songs-detail", kwargs={"pk": song.pk}))
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Song.objects.count(), 0)

    def test_publish_album_release(self):
        self._auth(self.artist_user)
        res = self.client.post(
            reverse("releases-create"),
            {
                "release_type": "album",
                "title": "Blue Hours",
                "genre": "Indie",
                "release_year": 2026,
                "cover": self._cover(),
                "track_0_title": "Dawn",
                "track_0_audio": self._audio("dawn.mp3"),
                "track_1_title": "Dusk",
                "track_1_audio": self._audio("dusk.mp3"),
            },
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(Album.objects.count(), 1)
        self.assertEqual(Song.objects.count(), 2)
        self.assertEqual(len(res.data["songs"]), 2)
