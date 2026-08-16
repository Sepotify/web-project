"use client";

import {
  attachQualityGraph,
  detachQualityGraph,
  setActivePlaybackQuality,
} from "@/lib/audio-quality-graph";
import {
  CROSSFADE_SECONDS,
  crossfadeVolumeFactors,
  getRemainingTime,
  type AudioQuality,
} from "@/lib/player-advanced";
import { useCallback, useEffect, useRef } from "react";
import { Howl } from "howler";

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
  const progressFrameRef = useRef<number | null>(null);
  const userVolumeRef = useRef(1);
  const qualityRef = useRef<AudioQuality>("high");
  const crossfadingRef = useRef(false);
  const finishingRef = useRef(false);
  const fadeWindowRef = useRef(CROSSFADE_SECONDS);

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

    const remaining = getRemainingTime(outgoing.seek() as number, outgoing.duration());
    const { outgoing: outFactor, incoming: inFactor } = crossfadeVolumeFactors(
      remaining,
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
      if (!howl || !playing) return;

      if (crossfadingRef.current && incoming) {
        applyCrossfadeVolumes();
        const remaining = getRemainingTime(howl.seek() as number, howl.duration());
        if (remaining <= 0.05) {
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
          void attachQualityGraph(howl, qualityRef.current);
          if (typeof options.startAt === "number" && options.startAt > 0) {
            howl.seek(options.startAt);
          }
          onProgressRef.current(
            typeof options.startAt === "number" ? options.startAt : 0,
            howl.duration(),
          );
          if (options.autoplay) {
            howl.play();
            startProgressLoop();
          }
        },
        onplay: () => {
          void attachQualityGraph(howl, qualityRef.current);
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
      setActivePlaybackQuality(quality);
      unload();

      howlRef.current = createHowl(url, trackVolume, {
        autoplay,
        startAt,
      });
    },
    [createHowl, unload],
  );

  const beginCrossfade = useCallback(
    (nextUrl: string, trackVolume: number, fadeSeconds: number, quality: AudioQuality) => {
      if (crossfadingRef.current || !howlRef.current) return false;

      userVolumeRef.current = trackVolume;
      qualityRef.current = quality;
      fadeWindowRef.current = Math.max(0.2, fadeSeconds);
      crossfadingRef.current = true;
      finishingRef.current = false;

      incomingRef.current = createHowl(nextUrl, 0, {
        autoplay: true,
      });

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

  const setQuality = useCallback((quality: AudioQuality, trackVolume: number) => {
    qualityRef.current = quality;
    userVolumeRef.current = trackVolume;
    setActivePlaybackQuality(quality);
    if (howlRef.current) void attachQualityGraph(howlRef.current, quality);
    if (incomingRef.current) void attachQualityGraph(incomingRef.current, quality);
  }, []);

  const isCrossfading = useCallback(() => crossfadingRef.current, []);

  useEffect(() => unload, [unload]);

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
