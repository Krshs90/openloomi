import { getResolvedUserTimezone } from "@/lib/utils/timezone";
import { type HourCycle, resolveHourCycle } from "@/lib/timezone/constants";
import { UserLocale } from "@openloomi/shared";

type LocalDateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

type TaskTimeDisplayMode = "title" | "message";

function getLocalDateTimeParts(
  date: Date,
  timezone: string,
): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: getValue("year"),
    month: getValue("month"),
    day: getValue("day"),
    hour: getValue("hour"),
    minute: getValue("minute"),
  };
}

function getResolvedDisplayLanguage(language?: string): string {
  if (typeof language === "string" && language.trim().length > 0) {
    return language;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en-US";
}

/**
 * Time-of-day label honoring the user's hour-cycle preference.
 *
 * The effective clock is resolved once via {@link resolveHourCycle}: an explicit
 * preference wins; `null` follows the display language's own default (h12 for
 * en-US, h23 for zh-Hans / en-GB / etc.).
 * - h12: localized 12-hour time with day period (e.g. "6:00 PM" / "下午6:00").
 * - h23: locale-independent "HH:MM".
 */
function getTimeLabel(
  date: Date,
  timezone: string,
  hourCycle: HourCycle | null,
  language: string,
): string {
  if (resolveHourCycle(hourCycle, language) === "h12") {
    try {
      return new Intl.DateTimeFormat(language, {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hourCycle: "h12",
      }).format(date);
    } catch {
      // Fall through to the deterministic 24-hour label on any Intl failure.
    }
  }
  const parts = getLocalDateTimeParts(date, timezone);
  return `${parts.hour}:${parts.minute}`;
}

export function formatTaskLastExecutionTime(
  value: string | number | Date | null | undefined,
  timezone = getResolvedUserTimezone(),
  language?: string,
  displayMode: TaskTimeDisplayMode = "title",
  hourCycle: HourCycle | null = null,
): string {
  if (value == null) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const nowParts = getLocalDateTimeParts(new Date(), timezone);
  const targetParts = getLocalDateTimeParts(date, timezone);
  const resolvedLanguage = getResolvedDisplayLanguage(language);
  const timeLabel = getTimeLabel(date, timezone, hourCycle, resolvedLanguage);
  const isSameYear = targetParts.year === nowParts.year;
  const isSameMonth = isSameYear && targetParts.month === nowParts.month;
  const isSameDay = isSameMonth && targetParts.day === nowParts.day;

  if (UserLocale.isChineseCode(resolvedLanguage)) {
    if (displayMode === "title") {
      if (isSameDay) return timeLabel;
      if (isSameMonth) {
        return `${Number(targetParts.day)}日，${timeLabel}`;
      }
      if (isSameYear) {
        return `${Number(targetParts.month)}月${Number(targetParts.day)}日，${timeLabel}`;
      }
    }

    if (displayMode === "message" && isSameYear) {
      return `${Number(targetParts.month)}月${Number(targetParts.day)}日，${timeLabel}`;
    }

    return `${targetParts.year}年${Number(targetParts.month)}月${Number(targetParts.day)}日，${timeLabel}`;
  }

  const monthLabel =
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
    })
      .format(date)
      .replace(/\.$/, "") || targetParts.month;

  if (displayMode === "title") {
    if (isSameDay) return timeLabel;
    if (isSameMonth) {
      return `${Number(targetParts.day)},${timeLabel}`;
    }
    if (isSameYear) {
      return `${monthLabel} ${Number(targetParts.day)},${timeLabel}`;
    }
  }

  if (displayMode === "message" && isSameYear) {
    return `${monthLabel} ${Number(targetParts.day)},${timeLabel}`;
  }

  return `${monthLabel} ${Number(targetParts.day)}, ${targetParts.year},${timeLabel}`;
}
