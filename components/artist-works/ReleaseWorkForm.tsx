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
import {
  publishSingle,
  validatePublishSingleInput,
  type PublishSingleErrors,
} from "@/lib/publish";

interface ReleaseWorkFormProps {
  artistId: string;
  onPublished: () => void;
}

export function ReleaseWorkForm({ artistId, onPublished }: ReleaseWorkFormProps) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<PublishSingleErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  function clearFieldError(field: keyof PublishSingleErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validatePublishSingleInput({
      title,
      lyrics,
      audioFile: audioFile ?? undefined,
      coverFile: coverFile ?? undefined,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!audioFile || !coverFile) return;

    setIsSubmitting(true);
    const result = await publishSingle(artistId, {
      title,
      lyrics,
      audioFile,
      coverFile,
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      }
      return;
    }

    setTitle("");
    setLyrics("");
    setAudioFile(null);
    setCoverFile(null);
    setErrors({});
    onPublished();
  }

  const audioAccept = ALLOWED_AUDIO_EXTENSIONS.join(",");
  const coverAccept = ALLOWED_COVER_MIME_TYPES.join(",");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        label="Track title"
        name="title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          clearFieldError("title");
        }}
        placeholder="Name your single"
        error={errors.title}
        required
      />

      <FileUploadField
        label="Audio file"
        accept={audioAccept}
        hint="Supported formats: FLAC, WAV, MP3. File is stored locally in this browser."
        selectedFile={audioFile}
        error={errors.audioFile}
        onFileSelect={(file) => {
          setAudioFile(file);
          clearFieldError("audioFile");
        }}
      />

      <Textarea
        label="Lyrics"
        name="lyrics"
        value={lyrics}
        onChange={(event) => {
          setLyrics(event.target.value);
          clearFieldError("lyrics");
        }}
        placeholder="Paste or write the song lyrics here..."
        error={errors.lyrics}
      />

      <FileUploadField
        label="Cover image"
        accept={coverAccept}
        hint="Upload artwork for this single. JPG, PNG, or WebP up to 2 MB."
        selectedFile={coverFile}
        error={errors.coverFile}
        onFileSelect={(file) => {
          setCoverFile(file);
          clearFieldError("coverFile");
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

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Publishing..." : "Publish single"}
      </Button>
    </form>
  );
}
