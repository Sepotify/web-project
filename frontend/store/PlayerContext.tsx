"use client";

import { useAudioEngine } from "@/hooks/useAudioEngine";
import { getPlayableMediaUrl, getSongAudioUrl } from "@/lib/audio";
import {
  accentFromSeed,
  extractDominantColor,
  mixWithWhite,
  rgbToCss,
} from "@/lib/cover-color";
import {
  CROSSFADE_SECONDS,
  getEffectiveDuration,
  getRemainingTime,
  readPlayerAdvancedSettings,
  shouldStartCrossfade,
  toggleAudioQuality,
  writePlayerAdvancedSettings,
  type AudioQuality,
} from "@/lib/player-advanced";
import {
  cycleRepeatMode,
  getNextIndex,
  getPreviousIndex,
  moveQueueItem,
  shuffleSongs,
} from "@/lib/player-utils";
import { incrementDailyStreamCount } from "@/lib/streaming";
import { getAppSettings } from "@/lib/storage";
import type { Song } from "@/types";
import type { RepeatMode } from "@/types/player";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PlayerContextValue {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  isQueueOpen: boolean;
  isExpanded: boolean;
  quality: AudioQuality;
  crossfadeEnabled: boolean;
  accentColor: string;
  accentHover: string;
  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  openQueue: () => void;
  closeQueue: () => void;
  toggleQueue: () => void;
  expandPlayer: () => void;
  collapsePlayer: () => void;
  setQuality: (quality: AudioQuality) => void;
  toggleQuality: () => void;
  toggleCrossfade: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => getAppSettings().defaultVolume);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [quality, setQualityState] = useState<AudioQuality>(
    () => readPlayerAdvancedSettings().quality,
  );
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(
    () => readPlayerAdvancedSettings().crossfadeEnabled,
  );
  const [accent, setAccent] = useState(() => accentFromSeed(""));

  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);
  const shuffleRef = useRef(shuffle);
  const originalQueueRef = useRef(originalQueue);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const qualityRef = useRef(quality);
  const crossfadeEnabledRef = useRef(crossfadeEnabled);
  const pendingNextIndexRef = useRef<number | null>(null);
  const loadSongAtIndexRef = useRef<(index: number, songs: Song[], autoplay: boolean) => void>(
    () => {},
  );

  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  repeatModeRef.current = repeatMode;
  shuffleRef.current = shuffle;
  originalQueueRef.current = originalQueue;
  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;
  qualityRef.current = quality;
  crossfadeEnabledRef.current = crossfadeEnabled;

  const audioRef = useRef<ReturnType<typeof useAudioEngine> | null>(null);

  const handleProgress = useCallback((time: number, trackDuration: number) => {
    setCurrentTime(time);
    if (trackDuration > 0) {
      setDuration(trackDuration);
    }

    const engine = audioRef.current;
    if (!engine) return;

    const songs = queueRef.current;
    const currentSongDuration = songs[currentIndexRef.current]?.durationSeconds ?? 0;
    const nextIndex = getNextIndex(
      currentIndexRef.current,
      songs.length,
      repeatModeRef.current,
    );
    const hasNextTrack = nextIndex !== null && nextIndex !== currentIndexRef.current;
    const remaining = getRemainingTime(
      time,
      getEffectiveDuration(trackDuration, currentSongDuration),
    );

    if (
      !shouldStartCrossfade({
        enabled: crossfadeEnabledRef.current,
        isAlreadyCrossfading: engine.isCrossfading(),
        remaining,
        hasNextTrack,
      }) ||
      nextIndex === null
    ) {
      return;
    }

    const nextSong = songs[nextIndex];
    if (!nextSong) return;

    const started = engine.beginCrossfade(
      getSongAudioUrl(nextSong),
      volumeRef.current,
      remaining,
      qualityRef.current,
    );
    if (started) {
      pendingNextIndexRef.current = nextIndex;
    }
  }, []);

  const handleTrackEnd = useCallback(() => {
    pendingNextIndexRef.current = null;
    const songs = queueRef.current;
    const index = currentIndexRef.current;
    const mode = repeatModeRef.current;
    const nextIndex = getNextIndex(index, songs.length, mode);

    if (nextIndex === null) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    loadSongAtIndexRef.current(nextIndex, songs, true);
  }, []);

  const handleCrossfadeComplete = useCallback(() => {
    const nextIndex = pendingNextIndexRef.current;
    pendingNextIndexRef.current = null;
    if (nextIndex === null) return;

    const song = queueRef.current[nextIndex];
    setCurrentIndex(nextIndex);
    if (song) {
      setDuration(song.durationSeconds);
    }
    incrementDailyStreamCount();
  }, []);

  const audio = useAudioEngine({
    onTrackEnd: handleTrackEnd,
    onProgress: handleProgress,
    onCrossfadeComplete: handleCrossfadeComplete,
  });
  audioRef.current = audio;

  const loadSongAtIndex = useCallback(
    (index: number, songs: Song[], autoplay: boolean) => {
      const song = songs[index];
      if (!song) return;

      pendingNextIndexRef.current = null;
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(song.durationSeconds);

      audio.loadTrack(getSongAudioUrl(song), volumeRef.current, autoplay, qualityRef.current);
      setIsPlaying(autoplay);

      if (autoplay) {
        incrementDailyStreamCount();
      }
    },
    [audio],
  );

  loadSongAtIndexRef.current = loadSongAtIndex;

  const currentSong = queue[currentIndex] ?? null;
  const accentColor = rgbToCss(accent);
  const accentHover = rgbToCss(mixWithWhite(accent, 0.22));

  useEffect(() => {
    if (!currentSong) {
      setAccent(accentFromSeed(""));
      return;
    }

    setAccent(accentFromSeed(currentSong.title));
    if (!currentSong.coverUrl) return;

    let cancelled = false;
    void extractDominantColor(getPlayableMediaUrl(currentSong.coverUrl)).then((rgb) => {
      if (!cancelled && rgb) setAccent(rgb);
    });

    return () => {
      cancelled = true;
    };
  }, [currentSong?.id, currentSong?.coverUrl, currentSong?.title]);

  const playQueue = useCallback(
    (songs: Song[], startIndex = 0) => {
      if (songs.length === 0) return;

      setOriginalQueue(songs);
      setQueue(songs);
      setShuffle(false);
      loadSongAtIndex(startIndex, songs, true);
    },
    [loadSongAtIndex],
  );

  const playSong = useCallback(
    (song: Song, songs?: Song[]) => {
      const nextQueue = songs ?? [song];
      const index = nextQueue.findIndex((item) => item.id === song.id);
      playQueue(nextQueue, index >= 0 ? index : 0);
    },
    [playQueue],
  );

  const togglePlay = useCallback(() => {
    if (!queueRef.current[currentIndexRef.current]) return;

    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.play();
    setIsPlaying(true);
  }, [audio]);

  const playNext = useCallback(() => {
    const songs = queueRef.current;
    const nextIndex = getNextIndex(
      currentIndexRef.current,
      songs.length,
      repeatModeRef.current,
    );

    if (nextIndex === null) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (
      crossfadeEnabledRef.current &&
      nextIndex !== currentIndexRef.current &&
      isPlayingRef.current &&
      !audio.isCrossfading()
    ) {
      const nextSong = songs[nextIndex];
      const started = audio.beginCrossfade(
        getSongAudioUrl(nextSong),
        volumeRef.current,
        CROSSFADE_SECONDS,
        qualityRef.current,
      );
      if (started) {
        pendingNextIndexRef.current = nextIndex;
        return;
      }
    }

    loadSongAtIndex(nextIndex, songs, true);
  }, [audio, loadSongAtIndex]);

  const playPrevious = useCallback(() => {
    const songs = queueRef.current;

    if (currentTime > 3) {
      audio.seek(0);
      setCurrentTime(0);
      return;
    }

    const previousIndex = getPreviousIndex(currentIndexRef.current, songs.length);
    loadSongAtIndex(previousIndex, songs, true);
  }, [audio, currentTime, loadSongAtIndex]);

  const seek = useCallback(
    (time: number) => {
      audio.seek(time);
      setCurrentTime(time);
    },
    [audio],
  );

  const setVolume = useCallback(
    (nextVolume: number) => {
      setVolumeState(nextVolume);
      volumeRef.current = nextVolume;
      audio.setVolume(nextVolume);
    },
    [audio],
  );

  const toggleRepeat = useCallback(() => {
    setRepeatMode((current) => cycleRepeatMode(current));
  }, []);

  const setQuality = useCallback(
    (nextQuality: AudioQuality) => {
      setQualityState(nextQuality);
      qualityRef.current = nextQuality;
      audio.setQuality(nextQuality, volumeRef.current, isPlayingRef.current);
      writePlayerAdvancedSettings({
        quality: nextQuality,
        crossfadeEnabled: crossfadeEnabledRef.current,
      });
    },
    [audio],
  );

  const toggleQuality = useCallback(() => {
    setQuality(toggleAudioQuality(qualityRef.current));
  }, [setQuality]);

  const toggleCrossfade = useCallback(() => {
    setCrossfadeEnabled((current) => {
      const next = !current;
      crossfadeEnabledRef.current = next;
      if (!next) audio.cancelCrossfade();
      writePlayerAdvancedSettings({
        quality: qualityRef.current,
        crossfadeEnabled: next,
      });
      return next;
    });
  }, [audio]);

  const toggleShuffle = useCallback(() => {
    setShuffle((currentShuffle) => {
      const songs = queueRef.current;
      const index = currentIndexRef.current;
      const original = originalQueueRef.current;

      if (currentShuffle) {
        const currentSongId = songs[index]?.id;
        const restoredIndex = original.findIndex((song) => song.id === currentSongId);
        setQueue(original);
        setCurrentIndex(restoredIndex >= 0 ? restoredIndex : 0);
        return false;
      }

      if (songs.length <= 1) return currentShuffle;

      const shuffled = shuffleSongs(original.length > 0 ? original : songs, index);
      setQueue(shuffled);
      setCurrentIndex(0);
      return true;
    });
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((currentQueue) => {
        if (index < 0 || index >= currentQueue.length) return currentQueue;

        const removingCurrent = index === currentIndexRef.current;
        const nextQueue = currentQueue.filter((_, itemIndex) => itemIndex !== index);

        setOriginalQueue((currentOriginal) =>
          currentOriginal.filter((song) => song.id !== currentQueue[index]?.id),
        );

        if (nextQueue.length === 0) {
          audio.unload();
          setIsPlaying(false);
          setCurrentIndex(0);
          setCurrentTime(0);
          setDuration(0);
          return [];
        }

        if (removingCurrent) {
          const nextIndex = Math.min(index, nextQueue.length - 1);
          setCurrentIndex(nextIndex);
          loadSongAtIndex(nextIndex, nextQueue, isPlayingRef.current);
        } else if (index < currentIndexRef.current) {
          setCurrentIndex((value) => value - 1);
        }

        return nextQueue;
      });
    },
    [audio, loadSongAtIndex],
  );

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((currentQueue) => {
      const nextQueue = moveQueueItem(currentQueue, fromIndex, toIndex);
      const current = currentIndexRef.current;

      if (fromIndex === current) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < current && toIndex >= current) {
        setCurrentIndex(current - 1);
      } else if (fromIndex > current && toIndex <= current) {
        setCurrentIndex(current + 1);
      }

      if (!shuffleRef.current) {
        setOriginalQueue(nextQueue);
      }

      return nextQueue;
    });
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentSong,
      queue,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume,
      repeatMode,
      shuffle,
      isQueueOpen,
      isExpanded,
      quality,
      crossfadeEnabled,
      accentColor,
      accentHover,
      playSong,
      playQueue,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleRepeat,
      toggleShuffle,
      removeFromQueue,
      reorderQueue,
      openQueue: () => setIsQueueOpen(true),
      closeQueue: () => setIsQueueOpen(false),
      toggleQueue: () => setIsQueueOpen((open) => !open),
      expandPlayer: () => setIsExpanded(true),
      collapsePlayer: () => setIsExpanded(false),
      setQuality,
      toggleQuality,
      toggleCrossfade,
    }),
    [
      currentSong,
      queue,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume,
      repeatMode,
      shuffle,
      isQueueOpen,
      isExpanded,
      quality,
      crossfadeEnabled,
      accentColor,
      accentHover,
      playSong,
      playQueue,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleRepeat,
      toggleShuffle,
      removeFromQueue,
      reorderQueue,
      setQuality,
      toggleQuality,
      toggleCrossfade,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
