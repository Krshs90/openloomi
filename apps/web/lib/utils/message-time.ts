import type { ChatMessage, MessageMetadata } from "@openloomi/shared";

type MessageTimeLike = {
  createdAt?: string | number | Date;
  timestamp?: string | number | Date;
  metadata?: Pick<MessageMetadata, "createdAt" | "finalizedAt">;
};

function parseMessageTime(value?: string | number | Date): number | undefined {
  if (value == null) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

/**
 * Start time of a message, used for chronology and duration start.
 */
export function getMessageStartTs(message: ChatMessage): number | undefined {
  const candidate = message as MessageTimeLike;
  return (
    parseMessageTime(candidate.createdAt) ??
    parseMessageTime(candidate.timestamp) ??
    parseMessageTime(candidate.metadata?.createdAt)
  );
}

/**
 * End time of a message, used for durations and finalized assistant bubbles.
 */
export function getMessageEndTs(message: ChatMessage): number | undefined {
  const candidate = message as MessageTimeLike;
  return (
    parseMessageTime(candidate.metadata?.finalizedAt) ??
    getMessageStartTs(message)
  );
}

/**
 * Preferred display time for a message.
 * Assistant messages show finalizedAt when available; others fall back to start time.
 */
export function getMessageDisplayTs(message: ChatMessage): number | undefined {
  return getMessageEndTs(message);
}

export function getMessageDisplayDate(message: ChatMessage): Date | undefined {
  const timestamp = getMessageDisplayTs(message);
  return timestamp == null ? undefined : new Date(timestamp);
}
