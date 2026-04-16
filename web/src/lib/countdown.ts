/**
 * Countdown helpers — pure functions used by the Countdown island.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  done: boolean;
}

export function diff(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = target.getTime() - now.getTime();
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, done: true };
  }
  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / 1000 / 60 / 60) % 24);
  const days = Math.floor(totalMs / 1000 / 60 / 60 / 24);
  return { days, hours, minutes, seconds, totalMs, done: false };
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Fraction of countdown remaining vs an "anchor" start point (used for the SVG arc). */
export function progress(target: Date, anchor: Date, now: Date = new Date()): number {
  const total = target.getTime() - anchor.getTime();
  const left = target.getTime() - now.getTime();
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, left / total));
}
