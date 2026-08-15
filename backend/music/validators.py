from pathlib import Path

from django.core.exceptions import ValidationError

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac"}
ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/flac",
    "audio/x-flac",
}
ALLOWED_COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_COVER_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

MAX_AUDIO_BYTES = 8 * 1024 * 1024
MAX_COVER_BYTES = 2 * 1024 * 1024


def _extension(filename: str) -> str:
    return Path(filename or "").suffix.lower()


def _file_size(file) -> int:
    return int(getattr(file, "size", 0) or 0)


def validate_audio_file(file) -> None:
    filename = getattr(file, "name", "")
    extension = _extension(filename)
    if extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError("Audio must be MP3, WAV, or FLAC.")

    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise ValidationError("Unsupported audio format.")

    if _file_size(file) > MAX_AUDIO_BYTES:
        raise ValidationError("Audio file must be 8 MB or smaller.")


def validate_cover_file(file) -> None:
    filename = getattr(file, "name", "")
    extension = _extension(filename)
    if extension not in ALLOWED_COVER_EXTENSIONS:
        raise ValidationError("Cover must be a JPG, PNG, or WebP image.")

    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_COVER_CONTENT_TYPES:
        raise ValidationError("Cover must be a JPG, PNG, or WebP image.")

    if _file_size(file) > MAX_COVER_BYTES:
        raise ValidationError("Cover image must be 2 MB or smaller.")
