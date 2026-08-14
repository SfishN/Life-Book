export function toDateKey(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function monthTitle(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function friendlyDate(key: string): string {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function isCarriedForward(scheduledDate: string, status: string): boolean {
  return status === "open" && scheduledDate < todayKey();
}
