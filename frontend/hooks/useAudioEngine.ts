"use client";

import { useCallback, useEffect, useRef } from "react";
import { Howl } from "howler";

interface UseAudioEngineOptions {
  onTrackEnd: () => void;
  onProgress: (currentTime: number, duration: number) => void;
}

export function useAudioEngine({ onTrackEnd, onProgress }: UseAudioEngineOptions) {
  const howlRef = useRef<Howl | null>(null);
  const progressFrameRef = useRef<number | null>(null);
  const onTrackEndRef = useRef(onTrackEnd);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
    onProgressRef.current = onProgress;
  }, [onTrackEnd, onProgress]);

  const stopProgressLoop = useCallback(() => {
    if (progressFrameRef.current !== null) {
      cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    }
  }, []);

  const startProgressLoop = useCallback(() => {
    stopProgressLoop();

    const tick = () => {
      const howl = howlRef.current;
      if (howl && howl.playing()) {
        onProgressRef.current(howl.seek() as number, howl.duration());
        progressFrameRef.current = requestAnimationFrame(tick);
      }
    };

    progressFrameRef.current = requestAnimationFrame(tick);
  }, [stopProgressLoop]);

  const unload = useCallback(() => {
    stopProgressLoop();
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
  }, [stopProgressLoop]);

  const loadTrack = useCallback(
    (url: string, trackVolume: number, autoplay: boolean) => {
      unload();

      const howl = new Howl({
        src: [url],
        html5: true,
        volume: trackVolume,
        onend: () => {
          stopProgressLoop();
          onTrackEndRef.current();
        },
        onload: () => {
          onProgressRef.current(0, howl.duration());
          if (autoplay) {
            howl.play();
            startProgressLoop();
          }
        },
        onplay: () => startProgressLoop(),
        onpause: () => stopProgressLoop(),
        onstop: () => stopProgressLoop(),
      });

      howlRef.current = howl;
    },
    [startProgressLoop, stopProgressLoop, unload],
  );

  const play = useCallback(() => {
    howlRef.current?.play();
    startProgressLoop();
  }, [startProgressLoop]);

  const pause = useCallback(() => {
    howlRef.current?.pause();
    stopProgressLoop();
  }, [stopProgressLoop]);

  const seek = useCallback((time: number) => {
    const howl = howlRef.current;
    if (!howl) return;
    howl.seek(time);
    onProgressRef.current(time, howl.duration());
  }, []);

  const setVolume = useCallback((trackVolume: number) => {
    howlRef.current?.volume(trackVolume);
  }, []);

  useEffect(() => unload, [unload]);

  return {
    loadTrack,
    play,
    pause,
    seek,
    setVolume,
    unload,
  };
}
