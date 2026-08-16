"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileUploadField } from "@/components/artist-works/FileUploadField";
import {
  formatFeaturedArtistNames,
  resolveFeaturedArtistIds,
  updateArtistAlbumRequest,
  updateArtistSongRequest,
} from "@/lib/catalog";
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_COVER_MIME_TYPES,
  getAudioDurationSeconds,
  readFileAsDataUrl,
  validateAudioFile,
  validateCoverFile,
} from "@/lib/artist-works";
import { useAuth } from "@/store/AuthContext";
import type { Album, Song } from "@/types";

type EditTarget =
  | { type: "single"; song: Song }
  | { type: "album"; album: Album };

interface EditWorkModalProps {
  isOpen: boolean;
  target: EditTarget | null;
  artistId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditWorkModal({
  isOpen,
  target,
  artistId,
  onClose,
  onSaved,
}: EditWorkModalProps) {
  const { useApiAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!target) return;

    if (target.type === "single") {
      const { song } = target;
      setTitle(song.title);
      setGenre(song.genre ?? "");
      setReleaseYear(song.releaseYear?.toString() ?? "");
      setFeaturedArtists(formatFeaturedArtistNames(song.featuredArtistIds));
      setLyrics(song.lyrics ?? "");
      setCoverPreviewUrl(song.coverUrl ?? null);
    } else {
      const { album } = target;
      setTitle(album.title);
      setGenre(album.genre ?? "");
      setReleaseYear(album.releaseYear?.toString() ?? "");
      setFeaturedArtists("");
      setLyrics("");
      setCoverPreviewUrl(album.coverUrl ?? null);
    }

    setAudioFile(null);
    setCoverFile(null);
    setErrors({});
  }, [target]);

  useEffect(() => {
    if (!coverFile) return;

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;

    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!genre.trim()) nextErrors.genre = "Genre is required.";

    const parsedYear = Number(releaseYear);
    if (!releaseYear) {
      nextErrors.releaseYear = "Release year is required.";
    } else if (parsedYear < 1900 || parsedYear > 2100) {
      nextErrors.releaseYear = "Enter a valid release year.";
    }

    if (audioFile) {
      const audioError = validateAudioFile(audioFile);
      if (audioError) nextErrors.audioFile = audioError;
    }

    if (coverFile) {
      const coverError = validateCoverFile(coverFile);
      if (coverError) nextErrors.coverFile = coverError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let coverUrl: string | undefined;
      let audioUrl: string | undefined;
      let durationSeconds: number | undefined;

      if (coverFile && !useApiAuth) {
        coverUrl = await readFileAsDataUrl(coverFile);
      }

      if (audioFile && target.type === "single" && !useApiAuth) {
        audioUrl = await readFileAsDataUrl(audioFile);
        durationSeconds = await getAudioDurationSeconds(audioFile);
      } else if (audioFile && target.type === "single") {
        durationSeconds = await getAudioDurationSeconds(audioFile);
      }

      if (target.type === "single") {
        const featuredArtistIds = resolveFeaturedArtistIds(featuredArtists, artistId);
        const result = await updateArtistSongRequest(
          artistId,
          target.song.id,
          {
            title,
            genre,
            releaseYear: parsedYear,
            lyrics,
            featuredArtistIds,
            coverUrl,
            audioUrl,
            durationSeconds,
            coverFile,
            audioFile,
          },
          useApiAuth,
        );

        if (!result.success) {
          setErrors({ form: result.error ?? "Could not update this track." });
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await updateArtistAlbumRequest(
          artistId,
          target.album.id,
          {
            title,
            genre,
            releaseYear: parsedYear,
            coverUrl,
            coverFile,
          },
          useApiAuth,
        );

        if (!result.success) {
          setErrors({ form: result.error ?? "Could not update this album." });
          setIsSubmitting(false);
          return;
        }
      }

      onSaved();
      onClose();
    } catch {
      setErrors({ form: "Could not save changes." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const modalTitle =
    target?.type === "album" ? "Edit album" : "Edit single";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-xl">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <Input
          label={target?.type === "album" ? "Album title" : "Track title"}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            placeholder="Electronic"
            error={errors.genre}
          />
          <Input
            label="Release year"
            type="number"
            min={1900}
            max={2100}
            value={releaseYear}
            onChange={(event) => setReleaseYear(event.target.value)}
            error={errors.releaseYear}
          />
        </div>

        {target?.type === "single" && (
          <>
            <Input
              label="Featured artists"
              value={featuredArtists}
              onChange={(event) => setFeaturedArtists(event.target.value)}
              placeholder="Stage names, separated by commas"
            />
            <Textarea
              label="Lyrics"
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
            />
            <FileUploadField
              label="Replace audio file (optional)"
              accept={ALLOWED_AUDIO_EXTENSIONS.join(",")}
              selectedFile={audioFile}
              error={errors.audioFile}
              onFileSelect={setAudioFile}
            />
          </>
        )}

        <FileUploadField
          label="Replace cover image (optional)"
          accept={ALLOWED_COVER_MIME_TYPES.join(",")}
          selectedFile={coverFile}
          error={errors.coverFile}
          onFileSelect={setCoverFile}
          preview={
            coverPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl}
                alt="Cover preview"
                className="h-32 w-32 rounded-md object-cover"
              />
            ) : null
          }
        />

        {errors.form && <p className="text-sm text-accent-danger">{errors.form}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
