"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileUploadField } from "@/components/artist-works/FileUploadField";
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_COVER_MIME_TYPES,
} from "@/lib/artist-works";
import { getArtists } from "@/lib/storage";
import {
  publishRelease,
  validatePublishReleaseInput,
  type PublishReleaseErrors,
  type PublishTrackInput,
  type ReleaseType,
} from "@/lib/publish";
import { cn } from "@/lib/utils";

interface ReleaseWorkFormProps {
  artistId: string;
  onPublished: (releaseType: ReleaseType) => void;
}

interface TrackFormState {
  title: string;
  lyrics: string;
  audioFile: File | null;
}

const EMPTY_TRACK: TrackFormState = {
  title: "",
  lyrics: "",
  audioFile: null,
};

export function ReleaseWorkForm({ artistId, onPublished }: ReleaseWorkFormProps) {
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [tracks, setTracks] = useState<TrackFormState[]>([{ ...EMPTY_TRACK }]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<PublishReleaseErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collaboratorHint = getArtists()
    .filter((artist) => artist.id !== artistId && artist.status === "approved")
    .map((artist) => artist.stageName)
    .join(", ");

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  useEffect(() => {
    if (releaseType === "single") {
      setTracks((prev) => (prev.length > 1 ? [prev[0]] : prev));
    }
  }, [releaseType]);

  function clearError(key: keyof PublishReleaseErrors) {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function updateTrack(index: number, patch: Partial<TrackFormState>) {
    setTracks((prev) =>
      prev.map((track, trackIndex) =>
        trackIndex === index ? { ...track, ...patch } : track,
      ),
    );
  }

  function addTrack() {
    setTracks((prev) => [...prev, { ...EMPTY_TRACK }]);
  }

  function removeTrack(index: number) {
    setTracks((prev) => prev.filter((_, trackIndex) => trackIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trackInputs: PublishTrackInput[] = tracks.map((track) => ({
      title: releaseType === "single" ? title : track.title,
      lyrics: track.lyrics,
      audioFile: track.audioFile!,
    }));

    const validationErrors = validatePublishReleaseInput({
      releaseType,
      title,
      genre,
      releaseYear: Number(releaseYear),
      featuredArtists,
      coverFile: coverFile ?? undefined,
      tracks: tracks.map((track) => ({
        title: releaseType === "single" ? title : track.title,
        lyrics: track.lyrics,
        audioFile: track.audioFile ?? undefined,
      })) as PublishTrackInput[],
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!coverFile || tracks.some((track) => !track.audioFile)) return;

    setIsSubmitting(true);
    const result = await publishRelease(artistId, {
      releaseType,
      title,
      genre,
      releaseYear: Number(releaseYear),
      featuredArtists,
      coverFile,
      tracks: trackInputs,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.errors) setErrors(result.errors);
      return;
    }

    setTitle("");
    setGenre("");
    setReleaseYear(new Date().getFullYear().toString());
    setFeaturedArtists("");
    setTracks([{ ...EMPTY_TRACK }]);
    setCoverFile(null);
    setErrors({});
    onPublished(releaseType);
  }

  const audioAccept = ALLOWED_AUDIO_EXTENSIONS.join(",");
  const coverAccept = ALLOWED_COVER_MIME_TYPES.join(",");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-secondary">Release type</span>
        <div className="grid grid-cols-2 gap-2">
          {(["single", "album"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setReleaseType(type)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                releaseType === type
                  ? "border-accent-primary bg-accent-primary/10 text-text-primary"
                  : "border-border-default bg-bg-elevated text-text-secondary hover:bg-bg-hover",
              )}
            >
              {type === "single" ? "Single" : "Album"}
            </button>
          ))}
        </div>
      </div>

      <Input
        label={releaseType === "single" ? "Track title" : "Album title"}
        name="title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          clearError("title");
        }}
        placeholder={releaseType === "single" ? "Name your single" : "Name your album"}
        error={errors.title}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Genre"
          name="genre"
          value={genre}
          onChange={(event) => {
            setGenre(event.target.value);
            clearError("genre");
          }}
          placeholder="Electronic, Pop, Ambient..."
          error={errors.genre}
          required
        />
        <Input
          label="Release year"
          name="releaseYear"
          type="number"
          min={1900}
          max={2100}
          value={releaseYear}
          onChange={(event) => {
            setReleaseYear(event.target.value);
            clearError("releaseYear");
          }}
          error={errors.releaseYear}
          required
        />
      </div>

      <Input
        label="Featured artists"
        name="featuredArtists"
        value={featuredArtists}
        onChange={(event) => setFeaturedArtists(event.target.value)}
        placeholder="Stage names, separated by commas"
        hint={
          collaboratorHint
            ? `Approved collaborators: ${collaboratorHint}`
            : "Use stage names of other approved artists, separated by commas."
        }
      />

      <FileUploadField
        label="Cover image"
        accept={coverAccept}
        hint="Upload artwork for this release. JPG, PNG, or WebP up to 2 MB."
        selectedFile={coverFile}
        error={errors.coverFile}
        onFileSelect={(file) => {
          setCoverFile(file);
          clearError("coverFile");
        }}
        preview={
          coverPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreviewUrl}
              alt="Cover preview"
              className="h-40 w-40 rounded-md object-cover"
            />
          ) : null
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-text-secondary">
            {releaseType === "album" ? "Album tracks" : "Track details"}
          </h3>
          {releaseType === "album" && (
            <Button type="button" size="sm" variant="secondary" onClick={addTrack}>
              Add track
            </Button>
          )}
        </div>

        {errors.tracks && <p className="text-xs text-accent-danger">{errors.tracks}</p>}

        {tracks.map((track, index) => (
          <div
            key={`track-${index}`}
            className="rounded-lg border border-border-default bg-bg-secondary p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text-primary">
                Track {index + 1}
              </p>
              {releaseType === "album" && tracks.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTrack(index)}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {releaseType === "album" && (
                <Input
                  label="Track title"
                  value={track.title}
                  onChange={(event) => {
                    updateTrack(index, { title: event.target.value });
                    clearError(`track_${index}_title`);
                  }}
                  error={errors[`track_${index}_title`]}
                />
              )}

              <FileUploadField
                label="Audio file"
                accept={audioAccept}
                hint="Supported formats: FLAC, WAV, MP3."
                selectedFile={track.audioFile}
                error={errors[`track_${index}_audio`]}
                onFileSelect={(file) => {
                  updateTrack(index, { audioFile: file });
                  clearError(`track_${index}_audio`);
                }}
              />

              <Textarea
                label="Lyrics"
                value={track.lyrics}
                onChange={(event) => updateTrack(index, { lyrics: event.target.value })}
                placeholder="Paste or write the song lyrics here..."
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting
          ? "Publishing..."
          : releaseType === "single"
            ? "Publish single"
            : "Publish album"}
      </Button>
    </form>
  );
}
