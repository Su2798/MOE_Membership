/**
 * Core data model for the MOE Membership System (SRS v3.0).
 *
 * Dates (`YYYY-MM-DD`) are calendar days in Myanmar Standard Time.
 * Timestamps are ISO-8601 instants and are always displayed in Asia/Yangon.
 */

export type Role = "member" | "staff" | "admin"
export type Language = "en" | "my"

export type User = {
  id: string
  /** Human-friendly member number shown on scan results, e.g. MOE-00012. */
  memberNo: string
  name: string
  /** Canonical phone number (digits only, `959…`). Unique per account. */
  phone: string
  passwordHash: string
  role: Role
  status: "Active" | "Disabled"
  /** Set when an admin issued a temporary password. */
  mustChangePassword: boolean
  language: Language
  photoUrl?: string
  /** Secret used inside the personal QR. Rotated when an admin re-issues a QR. */
  qrToken: string
  /** Incremented on password reset / disable so existing logins are signed out. */
  tokenVersion: number
  createdAt: string
}

export type Plan = {
  id: string
  name: string
  description: string
  benefits: string
  /** Total visits granted by this plan (≥ 1). Copied into each membership. */
  totalVisits: number
  status: "Active" | "Archived"
  createdAt: string
  updatedAt: string
}

export type Cancellation = { at: string; by: string; reason: string }

export type Membership = {
  id: string
  userId: string
  planId: string
  /** Admin-chosen per user. Never derived from the plan. */
  startDate: string
  endDate: string
  /** Snapshot of the plan's total visits at assignment time. */
  totalVisits: number
  cancelled: Cancellation | null
  /** Previous membership period when this one was created as a renewal. */
  renewedFrom?: string
  createdAt: string
  createdBy: string
}

export type MeetupSession = {
  id: string
  planId: string
  name: string
  date: string
  open: boolean
  staffIds: string[]
  createdAt: string
}

export type Attendance = {
  id: string
  membershipId: string
  userId: string
  planId: string
  sessionId: string
  /** When the member actually attended (scan time, or the meetup date for backfills). */
  checkedInAt: string
  method: "QR" | "Admin"
  /** Who scanned / backfilled the record and when it was written. */
  recordedBy: string
  recordedAt: string
  voided: Cancellation | null
}

export type AuditEntry = {
  id: string
  at: string
  actorId: string
  action: string
  target: string
  before: string
  after: string
  reason: string
}

/** Scans attempted without internet; kept aside for an admin to backfill. */
export type OfflineNote = {
  id: string
  at: string
  recordedBy: string
  sessionId: string
  note: string
  resolved: boolean
}

export type Db = {
  version: 3
  seq: number
  users: User[]
  plans: Plan[]
  memberships: Membership[]
  sessions: MeetupSession[]
  attendance: Attendance[]
  audit: AuditEntry[]
  offlineNotes: OfflineNote[]
}

export type MembershipStatus =
  | "Cancelled"
  | "Expired"
  | "Completed"
  | "Upcoming"
  | "Active"
