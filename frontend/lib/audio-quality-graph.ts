import { getQualityCutoffHz, type AudioQuality } from "@/lib/player-advanced";
import type { Howl } from "howler";

interface HowlSoundNode {
  _node?: HTMLAudioElement | AudioNode;
}

interface HowlInternals {
  _sounds?: HowlSoundNode[];
}

let qualityContext: AudioContext | null = null;
let currentQuality: AudioQuality = "high";
const graphs = new WeakMap<HTMLAudioElement, BiquadFilterNode>();
const activeFilters = new Set<BiquadFilterNode>();

function getAudioElement(howl: Howl): HTMLAudioElement | null {
  const sounds = (howl as unknown as HowlInternals)._sounds;
  const node = sounds?.[0]?._node;
  return node instanceof HTMLAudioElement ? node : null;
}

function getQualityContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!qualityContext || qualityContext.state === "closed") {
    qualityContext = new AudioCtx();
  }
  return qualityContext;
}

export async function unlockQualityContext(): Promise<boolean> {
  const ctx = getQualityContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

function applyCutoff(filter: BiquadFilterNode, quality: AudioQuality): void {
  const ctx = filter.context;
  const cutoff = getQualityCutoffHz(quality);
  try {
    filter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.02);
  } catch {
    filter.frequency.value = cutoff;
  }
}

export function setActivePlaybackQuality(quality: AudioQuality): void {
  currentQuality = quality;
  for (const filter of activeFilters) {
    applyCutoff(filter, quality);
  }
}

export function getActivePlaybackQuality(): AudioQuality {
  return currentQuality;
}

export async function attachQualityGraph(howl: Howl, quality: AudioQuality = currentQuality): Promise<boolean> {
  currentQuality = quality;
  const element = getAudioElement(howl);
  if (!element) return false;

  const existing = graphs.get(element);
  if (existing) {
    applyCutoff(existing, quality);
    return true;
  }

  // Keep default Howler HTML5 output for high quality. MediaElementSource
  // cannot be undone and silences playback if the AudioContext is suspended.
  if (quality === "high") return false;

  const ctx = getQualityContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") return false;

    const source = ctx.createMediaElementSource(element);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.707;
    applyCutoff(filter, quality);
    source.connect(filter);
    filter.connect(ctx.destination);

    graphs.set(element, filter);
    activeFilters.add(filter);
    return true;
  } catch {
    return false;
  }
}

export function detachQualityGraph(howl: Howl): void {
  const element = getAudioElement(howl);
  if (!element) return;
  const filter = graphs.get(element);
  if (filter) {
    activeFilters.delete(filter);
    graphs.delete(element);
  }
}
