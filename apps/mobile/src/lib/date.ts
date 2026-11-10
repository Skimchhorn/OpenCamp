/** Today's local date as YYYY-MM-DD (the backend's LocalDate format). */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A real YYYY-MM-DD date that is not in the future. */
export function isPastOrTodayIso(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d && value <= todayIso(now);
}
