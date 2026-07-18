"use client";

import { usePlayer } from "@/hooks/usePlayer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { QueueItem } from "@/components/player/QueueItem";
import { cn } from "@/lib/utils";

interface QueuePanelProps {
  className?: string;
}

export function QueuePanel({ className }: QueuePanelProps) {
  const {
    queue,
    currentIndex,
    isQueueOpen,
    closeQueue,
    playQueue,
    removeFromQueue,
    reorderQueue,
  } = usePlayer();

  if (!isQueueOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[88px] right-4 z-50 flex max-h-[50vh] w-full max-w-md flex-col rounded-xl border border-border-default bg-bg-secondary shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Up next</h2>
        <Button variant="ghost" size="sm" onClick={closeQueue} aria-label="Close queue">
          ✕
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {queue.length === 0 ? (
          <EmptyState
            title="Queue is empty"
            description="Play a track to start building your queue."
            icon="🎧"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {queue.map((song, index) => (
              <QueueItem
                key={`${song.id}-${index}`}
                song={song}
                index={index}
                isCurrent={index === currentIndex}
                onPlay={() => playQueue(queue, index)}
                onRemove={() => removeFromQueue(index)}
                onMoveUp={index > 0 ? () => reorderQueue(index, index - 1) : undefined}
                onMoveDown={
                  index < queue.length - 1
                    ? () => reorderQueue(index, index + 1)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
