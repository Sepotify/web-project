from pathlib import Path

from django.core.exceptions import ValidationError


ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac"}
ALLOWED_COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

MAX_AUDIO_BYTES = 8 * 1024 * 1024
MAX_COVER_BYTES = 2 * 1024 * 1024


def _extension(file_obj) -> str:
    name = getattr(file_obj, "name", "") or ""
    return Path(name).suffix.lower()


def validate_audio_file(file_obj) -> None:
    if file_obj is None:
        return
    ext = _extension(file_obj)
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError("Audio must be FLAC, WAV, or MP3.")
    size = getattr(file_obj, "size", None)
    if size is not None and size > MAX_AUDIO_BYTES:
        raise ValidationError("Audio file must be 8 MB or smaller.")


def validate_cover_file(file_obj) -> None:
    if file_obj is None:
        return
    ext = _extension(file_obj)
    if ext not in ALLOWED_COVER_EXTENSIONS:
        raise ValidationError("Cover must be a JPG, PNG, or WebP image.")
    size = getattr(file_obj, "size", None)
    if size is not None and size > MAX_COVER_BYTES:
        raise ValidationError("Cover image must be 2 MB or smaller.")
