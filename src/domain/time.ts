/** Myanmar Standard Time helpers (UTC+06:30, no DST). */

export const MMT_ZONE = "Asia/Yangon"
const MMT_OFFSET_MS = 6.5 * 60 * 60 * 1000

/** Calendar date (`YYYY-MM-DD`) in Myanmar for the given instant. */
export function mmtDate(at: Date | string | number = Date.now()): string {
  const ms = new Date(at).getTime()
  return new Date(ms + MMT_OFFSET_MS).toISOString().slice(0, 10)
}

export function todayMMT() {
  return mmtDate()
}

/** ISO instant for a Myanmar wall-clock date/time. */
export function mmtInstant(date: string, time = "00:00") {
  const ms = Date.parse(`${date}T${time}:00Z`) - MMT_OFFSET_MS
  return new Date(ms).toISOString()
}

export function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** `2026-11-02` → `02 Nov 2026` */
export function formatDate(date: string | undefined) {
  if (!date) return "—"
  const [y, m, d] = date.split("-")
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/** ISO instant → `02 Nov 2026, 18:05` in Myanmar time. */
export function formatDateTime(at: string | undefined) {
  if (!at) return "—"
  const local = new Date(new Date(at).getTime() + MMT_OFFSET_MS).toISOString()
  return `${formatDate(local.slice(0, 10))}, ${local.slice(11, 16)}`
}

export function formatTime(at: string) {
  const local = new Date(new Date(at).getTime() + MMT_OFFSET_MS).toISOString()
  return local.slice(11, 16)
}
