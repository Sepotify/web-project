"use client";

import {
  attachQualityGraph,
  detachQualityGraph,
  setActivePlaybackQuality,
  unlockQualityContext,
} from "@/lib/audio-quality-graph";
import { getPlayableMediaUrl } from "@/lib/audio";
import {
  CROSSFADE_SECONDS,
  crossfadeVolumeFactors,
  getRemainingTime,
  isUsableDuration,
  type AudioQuality,
} from "@/lib/player-advanced";
import { useCallback, useEffect, useRef } from "react";
import { Howl } from "howler";

function resolvePlaybackUrl(rawUrl: string, quality: AudioQuality): string {
  const base = quality === "low" ? getPlayableMediaUrl(rawUrl) : rawUrl;
  return `${base}#playerQuality=${quality}`;
}

interface UseAudioEngineOptions {
  onTrackEnd: () => void;
  onProgress: (currentTime: number, duration: number) => void;
  onCrossfadeComplete: () => void;
}

export function useAudioEngine({
  onTrackEnd,
  onProgress,
  onCrossfadeComplete,
}: UseAudioEngineOptions) {
  const howlRef = useRef<Howl | null>(null);
  const incomingRef = useRef<Howl | null>(null);
  const sourceUrlRef = useRef("");
  const progressFrameRef = useRef<number | null>(null);
  const userVolumeRef = useRef(1);
  const qualityRef = useRef<AudioQuality>("high");
  const crossfadingRef = useRef(false);
  const finishingRef = useRef(false);
  const fadeWindowRef = useRef(CROSSFADE_SECONDS);
  const crossfadeStartedAtRef = useRef(0);
  const pendingSourceUrlRef = useRef("");
  const seekHoldRef = useRef<number | null>(null);

  const onTrackEndRef = useRef(onTrackEnd);
  const onProgressRef = useRef(onProgress);
  const onCrossfadeCompleteRef = useRef(onCrossfadeComplete);

  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
    onProgressRef.current = onProgress;
    onCrossfadeCompleteRef.current = onCrossfadeComplete;
  }, [onTrackEnd, onProgress, onCrossfadeComplete]);

  const stopProgressLoop = useCallback(() => {
    if (progressFrameRef.current !== null) {
      cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    }
  }, []);

  const reportProgress = useCallback((howl: Howl, fallbackTime?: number) => {
    const time =
      typeof fallbackTime === "number" ? fallbackTime : (howl.seek() as number);
    if (!Number.isFinite(time) || time < 0) return;

    const duration = howl.duration();
    onProgressRef.current(time, isUsableDuration(duration) ? duration : 0);
  }, []);

  const applyCrossfadeVolumes = useCallback(() => {
    const outgoing = howlRef.current;
    const incoming = incomingRef.current;
    if (!outgoing || !incoming || !crossfadingRef.current) return;

    const elapsed = (performance.now() - crossfadeStartedAtRef.current) / 1000;
    const remaining = fadeWindowRef.current - elapsed;
    const { outgoing: outFactor, incoming: inFactor } = crossfadeVolumeFactors(
      Math.max(0, remaining),
      fadeWindowRef.current,
    );
    outgoing.volume(userVolumeRef.current * outFactor);
    incoming.volume(userVolumeRef.current * inFactor);
  }, []);

  const unloadHowl = useCallback((howl: Howl | null) => {
    if (!howl) return;
    detachQualityGraph(howl);
    howl.unload();
  }, []);

  const finishCrossfade = useCallback(() => {
    if (finishingRef.current || !crossfadingRef.current) return;
    finishingRef.current = true;

    const outgoing = howlRef.current;
    const incoming = incomingRef.current;
    unloadHowl(outgoing);
    howlRef.current = incoming;
    incomingRef.current = null;
    crossfadingRef.current = false;
    if (pendingSourceUrlRef.current) {
      sourceUrlRef.current = pendingSourceUrlRef.current;
      pendingSourceUrlRef.current = "";
    }

    if (incoming) {
      incoming.volume(userVolumeRef.current);
    }

    finishingRef.current = false;
    onCrossfadeCompleteRef.current();
    if (incoming) {
      reportProgress(incoming);
    }
  }, [reportProgress, unloadHowl]);

  const startProgressLoop = useCallback(() => {
    stopProgressLoop();

    const tick = () => {
      const howl = howlRef.current;
      const incoming = incomingRef.current;
      const playing = Boolean(howl?.playing() || incoming?.playing());

      if (crossfadingRef.current) {
        applyCrossfadeVolumes();
        const elapsed = (performance.now() - crossfadeStartedAtRef.current) / 1000;
        if (elapsed >= fadeWindowRef.current - 0.05) {
          finishCrossfade();
        }
        const active = howlRef.current;
        if (active) {
          if (seekHoldRef.current != null && !isUsableDuration(active.duration())) {
            reportProgress(active, seekHoldRef.current);
          } else {
            reportProgress(active);
          }
        }
        progressFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!howl || !playing) return;

      if (seekHoldRef.current != null && !isUsableDuration(howl.duration())) {
        reportProgress(howl, seekHoldRef.current);
      } else {
        reportProgress(howl);
      }

      progressFrameRef.current = requestAnimationFrame(tick);
    };

    progressFrameRef.current = requestAnimationFrame(tick);
  }, [applyCrossfadeVolumes, finishCrossfade, reportProgress, stopProgressLoop]);

  const handleHowlEnd = useCallback(
    (howl: Howl) => {
      if (howl === incomingRef.current) return;

      if (howl !== howlRef.current) return;

      stopProgressLoop();
      if (crossfadingRef.current) {
        finishCrossfade();
        return;
      }
      onTrackEndRef.current();
    },
    [finishCrossfade, stopProgressLoop],
  );

  const createHowl = useCallback(
    (
      url: string,
      volume: number,
      options: {
        autoplay: boolean;
        startAt?: number;
        onReady?: (howl: Howl) => void;
      },
    ) => {
      let howl!: Howl;
      howl = new Howl({
        src: [url],
        html5: true,
        volume,
        onend: () => handleHowlEnd(howl),
        onload: () => {
          if (typeof options.startAt === "number" && options.startAt > 0) {
            howl.seek(options.startAt);
            seekHoldRef.current = null;
          }
          reportProgress(
            howl,
            typeof options.startAt === "number" ? options.startAt : undefined,
          );
          if (options.autoplay && !howl.playing()) {
            howl.play();
          }
          if (qualityRef.current === "low") {
            void attachQualityGraph(howl, "low");
          }
          options.onReady?.(howl);
        },
        onloaderror: () => {
          if (options.autoplay) howl.play();
        },
        onplay: () => {
          if (qualityRef.current === "low") {
            void attachQualityGraph(howl, "low");
          }
          startProgressLoop();
        },
        onpause: () => {
          if (howl === howlRef.current && !incomingRef.current?.playing()) {
            stopProgressLoop();
          }
        },
        onstop: () => {
          if (howl === howlRef.current && !incomingRef.current?.playing()) {
            stopProgressLoop();
          }
        },
      });

      return howl;
    },
    [handleHowlEnd, reportProgress, startProgressLoop, stopProgressLoop],
  );

  const cancelCrossfade = useCallback(() => {
    if (incomingRef.current) {
      unloadHowl(incomingRef.current);
      incomingRef.current = null;
    }
    crossfadingRef.current = false;
    finishingRef.current = false;
    howlRef.current?.volume(userVolumeRef.current);
  }, [unloadHowl]);

  const unload = useCallback(() => {
    stopProgressLoop();
    cancelCrossfade();
    unloadHowl(howlRef.current);
    howlRef.current = null;
  }, [cancelCrossfade, stopProgressLoop, unloadHowl]);

  const loadTrack = useCallback(
    (
      url: string,
      trackVolume: number,
      autoplay: boolean,
      quality: AudioQuality,
      startAt = 0,
    ) => {
      userVolumeRef.current = trackVolume;
      qualityRef.current = quality;
      sourceUrlRef.current = url;
      setActivePlaybackQuality(quality);
      unload();

      const playbackUrl = resolvePlaybackUrl(url, quality);
      howlRef.current = createHowl(playbackUrl, trackVolume, {
        autoplay,
        startAt,
      });
      if (autoplay) {
        howlRef.current.play();
      }
    },
    [createHowl, unload],
  );

  const beginCrossfade = useCallback(
    (nextUrl: string, trackVolume: number, fadeSeconds: number, quality: AudioQuality) => {
      if (crossfadingRef.current || !howlRef.current) return false;

      userVolumeRef.current = trackVolume;
      qualityRef.current = quality;
      pendingSourceUrlRef.current = nextUrl;
      fadeWindowRef.current = Math.max(0.2, fadeSeconds);
      crossfadeStartedAtRef.current = performance.now();
      crossfadingRef.current = true;
      finishingRef.current = false;

      incomingRef.current = createHowl(resolvePlaybackUrl(nextUrl, quality), 0, {
        autoplay: true,
      });
      incomingRef.current.play();

      startProgressLoop();
      return true;
    },
    [createHowl, startProgressLoop],
  );

  const play = useCallback(() => {
    howlRef.current?.play();
    incomingRef.current?.play();
    startProgressLoop();
  }, [startProgressLoop]);

  const pause = useCallback(() => {
    howlRef.current?.pause();
    incomingRef.current?.pause();
    stopProgressLoop();
  }, [stopProgressLoop]);

  const seek = useCallback(
    (time: number) => {
      const howl = howlRef.current;
      if (!howl) return;

      if (crossfadingRef.current) {
        const remaining = getRemainingTime(time, howl.duration());
        if (remaining > fadeWindowRef.current) {
          cancelCrossfade();
        }
      }

      howl.seek(time);
      onProgressRef.current(time, howl.duration());
    },
    [cancelCrossfade],
  );

  const setVolume = useCallback(
    (trackVolume: number) => {
      userVolumeRef.current = trackVolume;
      if (crossfadingRef.current) {
        applyCrossfadeVolumes();
        return;
      }
      howlRef.current?.volume(trackVolume);
    },
    [applyCrossfadeVolumes],
  );

  const setQuality = useCallback(
    (quality: AudioQuality, trackVolume: number, shouldPlay = false) => {
      userVolumeRef.current = trackVolume;
      void unlockQualityContext();

      if (qualityRef.current === quality) {
        setActivePlaybackQuality(quality);
        if (quality === "low" && howlRef.current) {
          void attachQualityGraph(howlRef.current, "low");
        }
        return;
      }

      qualityRef.current = quality;
      setActivePlaybackQuality(quality);

      const current = howlRef.current;
      if (!current || !sourceUrlRef.current) return;

      const wasPlaying =
        shouldPlay || current.playing() || Boolean(incomingRef.current?.playing());
      const currentTime = Math.max(0, current.seek() as number);
      cancelCrossfade();
      seekHoldRef.current = currentTime;

      const next = createHowl(resolvePlaybackUrl(sourceUrlRef.current, quality), trackVolume, {
        autoplay: wasPlaying,
        startAt: currentTime,
        onReady: (howl) => {
          howlRef.current = howl;
          seekHoldRef.current = null;
          if (wasPlaying) startProgressLoop();
          if (current !== howl) unloadHowl(current);
        },
      });

      next.once("loaderror", () => {
        seekHoldRef.current = null;
        unloadHowl(next);
      });
    },
    [cancelCrossfade, createHowl, startProgressLoop, unloadHowl],
  );

  const isCrossfading = useCallback(() => crossfadingRef.current, []);

  useEffect(
    () => () => {
      stopProgressLoop();
      if (incomingRef.current) {
        incomingRef.current.unload();
        incomingRef.current = null;
      }
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    },
    [stopProgressLoop],
  );

  return {
    loadTrack,
    beginCrossfade,
    cancelCrossfade,
    play,
    pause,
    seek,
    setVolume,
    setQuality,
    unload,
    isCrossfading,
    completeCrossfade: finishCrossfade,
  };
}
