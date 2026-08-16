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
    if (finishingRef.current) return;
    finishingRef.current = true;

    const outgoing = howlRef.current;
    const incoming = incomingRef.current;
    unloadHowl(outgoing);
    howlRef.current = incoming;
    incomingRef.current = null;
    crossfadingRef.current = false;

    if (incoming) {
      incoming.volume(userVolumeRef.current);
      onProgressRef.current(incoming.seek() as number, incoming.duration());
    }

    finishingRef.current = false;
    onCrossfadeCompleteRef.current();
  }, [unloadHowl]);

  const startProgressLoop = useCallback(() => {
    stopProgressLoop();

    const tick = () => {
      const howl = howlRef.current;
      const incoming = incomingRef.current;
      const playing = Boolean(howl?.playing() || incoming?.playing());
      if (!playing) return;

      if (crossfadingRef.current && incoming && howl) {
        applyCrossfadeVolumes();
        const elapsed = (performance.now() - crossfadeStartedAtRef.current) / 1000;
        if (elapsed >= fadeWindowRef.current - 0.05 || !howl.playing()) {
          finishCrossfade();
        }
      }

      const active = howlRef.current;
      if (active) {
        onProgressRef.current(active.seek() as number, active.duration());
      }

      progressFrameRef.current = requestAnimationFrame(tick);
    };

    progressFrameRef.current = requestAnimationFrame(tick);
  }, [applyCrossfadeVolumes, finishCrossfade, stopProgressLoop]);

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
          }
          onProgressRef.current(
            typeof options.startAt === "number" ? options.startAt : 0,
            howl.duration(),
          );
          if (options.autoplay && !howl.playing()) {
            howl.play();
          }
          if (qualityRef.current === "low") {
            void attachQualityGraph(howl, "low");
          }
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
          if (!incomingRef.current?.playing()) stopProgressLoop();
        },
        onstop: () => {
          if (!incomingRef.current?.playing()) stopProgressLoop();
        },
      });

      return howl;
    },
    [handleHowlEnd, startProgressLoop, stopProgressLoop],
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
      const currentTime = current.seek() as number;
      cancelCrossfade();

      const next = createHowl(resolvePlaybackUrl(sourceUrlRef.current, quality), trackVolume, {
        autoplay: wasPlaying,
        startAt: currentTime,
      });
      if (wasPlaying) next.play();
      howlRef.current = next;

      window.setTimeout(() => {
        if (current !== howlRef.current) unloadHowl(current);
      }, 300);
    },
    [cancelCrossfade, createHowl, unloadHowl],
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
  };
}
