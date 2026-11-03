/**
 * Business rules for SRS v3.0, written as pure functions over `Db`.
 * Every command validates its input, returns a *new* Db and never mutates the
 * old one, so the store can apply commands atomically (one at a time).
 */
import { isValidPhone, normalizePhone } from "./phone"
import { isValidDate, mmtDate } from "./time"
import type {
  Attendance,
  AuditEntry,
  Db,
  MeetupSession,
  Membership,
  MembershipStatus,
  Plan,
  Role,
  User,
} from "./types"

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

const fail = (code: string, message: string): never => {
  throw new DomainError(code, message)
}

/* ───────────────────────── helpers ───────────────────────── */

export function nextId(db: Db, prefix: string): [Db, string] {
  const seq = db.seq + 1
  return [{ ...db, seq }, `${prefix}-${String(seq).padStart(5, "0")}`]
}

export function randomToken(bytes = 18) {
  const buf = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Prototype-only password hashing (FNV-1a based). A production backend must
 * use a slow, salted algorithm (bcrypt / argon2) server-side.
 */
export function hashPassword(password: string) {
  let h = 0x811c9dc5
  const input = `moe-v3:${password}`
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `fnv1a$${h.toString(16)}`
}

export const QR_PREFIX = "MOE-QR:"
export const qrPayload = (user: User) => `${QR_PREFIX}${user.qrToken}`

function audit(
  db: Db,
  actorId: string,
  now: string,
  action: string,
  target: string,
  before = "",
  after = "",
  reason = "",
): Db {
  const [next, id] = nextId(db, "LOG")
  const entry: AuditEntry = {
    id,
    at: now,
    actorId,
    action,
    target,
    before,
    after,
    reason,
  }
  return { ...next, audit: [entry, ...next.audit] }
}

function requireActor(db: Db, actorId: string, roles: Role[]) {
  const actor = db.users.find((u) => u.id === actorId)
  if (!actor || actor.status !== "Active" || !roles.includes(actor.role))
    fail("FORBIDDEN", "You do not have permission to perform this action.")
  return actor as User
}

const requireReason = (reason: string) =>
  reason.trim() || fail("REASON_REQUIRED", "Please enter a reason.")

/* ───────────────────────── derived values ───────────────────────── */

export function validAttendance(db: Db, membershipId: string) {
  return db.attendance.filter(
    (a) => a.membershipId === membershipId && !a.voided,
  )
}

export function usedVisits(db: Db, membershipId: string) {
  return validAttendance(db, membershipId).length
}

export function remainingVisits(db: Db, m: Membership) {
  return Math.max(0, m.totalVisits - usedVisits(db, m.id))
}

/**
 * Status precedence: Cancelled → Expired → Completed → Upcoming → Active.
 * Valid from the start date until the end of the end date (Myanmar time).
 */
export function membershipStatus(
  db: Db,
  m: Membership,
  on: string = mmtDate(),
): MembershipStatus {
  if (m.cancelled) return "Cancelled"
  if (on > m.endDate) return "Expired"
  if (remainingVisits(db, m) <= 0) return "Completed"
  if (on < m.startDate) return "Upcoming"
  return "Active"
}

export function membershipSummary(db: Db, m: Membership, on?: string) {
  const used = usedVisits(db, m.id)
  return {
    membership: m,
    plan: db.plans.find((p) => p.id === m.planId),
    user: db.users.find((u) => u.id === m.userId),
    used,
    remaining: Math.max(0, m.totalVisits - used),
    status: membershipStatus(db, m, on),
  }
}

const overlaps = (a: Membership, start: string, end: string) =>
  a.startDate <= end && start <= a.endDate

function assertDates(startDate: string, endDate: string) {
  if (!startDate || !endDate)
    fail("DATES_REQUIRED", "Both start date and end date are required.")
  if (!isValidDate(startDate) || !isValidDate(endDate))
    fail("DATES_INVALID", "Please enter valid dates.")
  if (endDate < startDate)
    fail("END_BEFORE_START", "End date cannot be earlier than start date.")
}

function assertNoOverlap(
  db: Db,
  userId: string,
  planId: string,
  startDate: string,
  endDate: string,
  ignoreId?: string,
) {
  const clash = db.memberships.find(
    (m) =>
      m.userId === userId &&
      m.planId === planId &&
      m.id !== ignoreId &&
      !m.cancelled &&
      overlaps(m, startDate, endDate),
  )
  if (clash)
    fail(
      "OVERLAP",
      `This user already has this plan from ${clash.startDate} to ${clash.endDate}. Dates for the same plan cannot overlap.`,
    )
}

/* ───────────────────────── accounts ───────────────────────── */

export function findUserByPhone(db: Db, phone: string) {
  const canonical = normalizePhone(phone)
  return db.users.find((u) => u.phone === canonical)
}

type NewAccount = {
  name: string
  phone: string
  password: string
  role?: Role
  language?: User["language"]
}

function createUser(
  db: Db,
  input: NewAccount,
  now: string,
  mustChangePassword: boolean,
): [Db, User] {
  const name = input.name.trim()
  if (!name) fail("NAME_REQUIRED", "Full name is required.")
  if (!isValidPhone(input.phone))
    fail("PHONE_INVALID", "Please enter a valid Myanmar mobile number.")
  if (input.password.length < 6)
    fail("PASSWORD_SHORT", "Password must be at least 6 characters.")
  const existing = findUserByPhone(db, input.phone)
  if (existing)
    throw Object.assign(
      new DomainError(
        "PHONE_EXISTS",
        "An account with this phone number already exists.",
      ),
      { userId: existing.id },
    )

  const [withId, id] = nextId(db, "USR")
  const memberSeq = withId.users.filter((u) => u.role === "member").length + 1
  const user: User = {
    id,
    memberNo:
      (input.role ?? "member") === "member"
        ? `MOE-${String(memberSeq + 100).padStart(5, "0")}`
        : `STF-${id.slice(-4)}`,
    name,
    phone: normalizePhone(input.phone),
    passwordHash: hashPassword(input.password),
    role: input.role ?? "member",
    status: "Active",
    mustChangePassword,
    language: input.language ?? "en",
    qrToken: randomToken(),
    tokenVersion: 1,
    createdAt: now,
  }
  return [{ ...withId, users: [user, ...withId.users] }, user]
}

/** Self sign-up from the Telegram Mini App / Mobile App. */
export function signUp(db: Db, input: NewAccount, now: string) {
  const [next, user] = createUser(db, { ...input, role: "member" }, now, false)
  return { db: audit(next, user.id, now, "Signed up", user.memberNo), user }
}

/** Admin opens an account with a temporary password (forced change on first login). */
export function adminCreateAccount(
  db: Db,
  actorId: string,
  input: NewAccount,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const [next, user] = createUser(db, input, now, true)
  return {
    db: audit(
      next,
      actorId,
      now,
      `Created ${user.role} account`,
      `${user.name} · ${user.memberNo}`,
    ),
    user,
  }
}

export function login(db: Db, phone: string, password: string, roles: Role[]) {
  const user = findUserByPhone(db, phone)
  if (!user || user.passwordHash !== hashPassword(password))
    fail("BAD_CREDENTIALS", "Phone number or password is incorrect.")
  const u = user as User
  if (u.status !== "Active")
    fail("ACCOUNT_DISABLED", "This account has been disabled.")
  if (!roles.includes(u.role))
    fail("WRONG_APP", "This account cannot sign in here.")
  return u
}

export function changePassword(
  db: Db,
  userId: string,
  current: string,
  next: string,
  now: string,
) {
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail("NOT_FOUND", "Account not found.")
  if (user.passwordHash !== hashPassword(current))
    fail("BAD_CREDENTIALS", "Current password is incorrect.")
  if (next.length < 6)
    fail("PASSWORD_SHORT", "Password must be at least 6 characters.")
  if (next === current)
    fail("PASSWORD_SAME", "New password must be different.")
  const users = db.users.map((u) =>
    u.id === userId
      ? { ...u, passwordHash: hashPassword(next), mustChangePassword: false }
      : u,
  )
  // Password values are never written to the audit log.
  return audit({ ...db, users }, userId, now, "Changed password", user.memberNo)
}

export function updateProfile(
  db: Db,
  actorId: string,
  userId: string,
  changes: { name?: string; phone?: string; language?: User["language"] },
  now: string,
) {
  const actor = db.users.find((u) => u.id === actorId)
  if (!actor || (actor.role !== "admin" && actorId !== userId))
    fail("FORBIDDEN", "You do not have permission to perform this action.")
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail("NOT_FOUND", "Account not found.")
  const patch: Partial<User> = {}
  if (changes.name !== undefined) {
    if (!changes.name.trim()) fail("NAME_REQUIRED", "Full name is required.")
    patch.name = changes.name.trim()
  }
  if (changes.phone !== undefined && actor?.role === "admin") {
    if (!isValidPhone(changes.phone))
      fail("PHONE_INVALID", "Please enter a valid Myanmar mobile number.")
    const other = findUserByPhone(db, changes.phone)
    if (other && other.id !== userId)
      fail("PHONE_EXISTS", "An account with this phone number already exists.")
    patch.phone = normalizePhone(changes.phone)
  }
  if (changes.language) patch.language = changes.language
  const before = `${user.name} · ${user.phone}`
  const users = db.users.map((u) => (u.id === userId ? { ...u, ...patch } : u))
  const after = `${patch.name ?? user.name} · ${patch.phone ?? user.phone}`
  return before === after
    ? { ...db, users }
    : audit({ ...db, users }, actorId, now, "Updated profile", user.memberNo, before, after)
}

/** Admin resets a password; every existing login of that user is signed out. */
export function resetPassword(
  db: Db,
  actorId: string,
  userId: string,
  tempPassword: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  if (tempPassword.length < 6)
    fail("PASSWORD_SHORT", "Password must be at least 6 characters.")
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail("NOT_FOUND", "Account not found.")
  const users = db.users.map((u) =>
    u.id === userId
      ? {
          ...u,
          passwordHash: hashPassword(tempPassword),
          mustChangePassword: true,
          tokenVersion: u.tokenVersion + 1,
        }
      : u,
  )
  return audit(
    { ...db, users },
    actorId,
    now,
    "Reset password",
    `${user.name} · ${user.memberNo}`,
    "",
    "Temporary password issued · sessions signed out",
  )
}

export function setAccountStatus(
  db: Db,
  actorId: string,
  userId: string,
  status: User["status"],
  reason: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  if (actorId === userId)
    fail("SELF", "You cannot disable your own account.")
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail("NOT_FOUND", "Account not found.")
  const users = db.users.map((u) =>
    u.id === userId
      ? {
          ...u,
          status,
          tokenVersion:
            status === "Disabled" ? u.tokenVersion + 1 : u.tokenVersion,
        }
      : u,
  )
  return audit(
    { ...db, users },
    actorId,
    now,
    status === "Disabled" ? "Disabled account" : "Enabled account",
    `${user.name} · ${user.memberNo}`,
    `Status: ${user.status}`,
    `Status: ${status}`,
    reason,
  )
}

/** Issues a new personal QR. The previous QR stops working immediately. */
export function regenerateQr(
  db: Db,
  actorId: string,
  userId: string,
  reason: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail("NOT_FOUND", "Account not found.")
  const users = db.users.map((u) =>
    u.id === userId ? { ...u, qrToken: randomToken() } : u,
  )
  // The secret itself is intentionally not logged.
  return audit(
    { ...db, users },
    actorId,
    now,
    "Re-issued QR",
    `${user.name} · ${user.memberNo}`,
    "Previous QR",
    "Previous QR revoked · new QR issued",
    reason,
  )
}

/* ───────────────────────── plans ───────────────────────── */

type PlanInput = Pick<Plan, "name" | "description" | "benefits" | "totalVisits">

function assertPlan(input: PlanInput) {
  if (!input.name.trim()) fail("NAME_REQUIRED", "Plan name is required.")
  if (!Number.isInteger(input.totalVisits) || input.totalVisits < 1)
    fail("VISITS_MIN", "Total visits must be at least 1.")
}

export function createPlan(db: Db, actorId: string, input: PlanInput, now: string) {
  requireActor(db, actorId, ["admin"])
  assertPlan(input)
  const [next, id] = nextId(db, "PLN")
  const plan: Plan = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    benefits: input.benefits.trim(),
    totalVisits: input.totalVisits,
    status: "Active",
    createdAt: now,
    updatedAt: now,
  }
  return audit(
    { ...next, plans: [plan, ...next.plans] },
    actorId,
    now,
    "Created plan",
    plan.name,
    "",
    `Total visits: ${plan.totalVisits}`,
  )
}

/** Editing a plan never changes memberships that were already assigned. */
export function updatePlan(
  db: Db,
  actorId: string,
  planId: string,
  input: PlanInput,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  assertPlan(input)
  const plan = db.plans.find((p) => p.id === planId)
  if (!plan) return fail("NOT_FOUND", "Plan not found.")
  const plans = db.plans.map((p) =>
    p.id === planId
      ? {
          ...p,
          name: input.name.trim(),
          description: input.description.trim(),
          benefits: input.benefits.trim(),
          totalVisits: input.totalVisits,
          updatedAt: now,
        }
      : p,
  )
  return audit(
    { ...db, plans },
    actorId,
    now,
    "Updated plan",
    plan.name,
    `${plan.name} · ${plan.totalVisits} visits`,
    `${input.name.trim()} · ${input.totalVisits} visits`,
  )
}

export function setPlanStatus(
  db: Db,
  actorId: string,
  planId: string,
  status: Plan["status"],
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const plan = db.plans.find((p) => p.id === planId)
  if (!plan) return fail("NOT_FOUND", "Plan not found.")
  const plans = db.plans.map((p) =>
    p.id === planId ? { ...p, status, updatedAt: now } : p,
  )
  return audit(
    { ...db, plans },
    actorId,
    now,
    status === "Archived" ? "Archived plan" : "Re-activated plan",
    plan.name,
    `Status: ${plan.status}`,
    `Status: ${status}`,
  )
}

/* ───────────────────────── memberships ───────────────────────── */

/**
 * Assigns a plan to a user. Admin must pick BOTH dates; nothing is
 * auto-filled or calculated from a duration.
 */
export function assignPlan(
  db: Db,
  actorId: string,
  input: {
    userId: string
    planId: string
    startDate: string
    endDate: string
    renewedFrom?: string
  },
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const user = db.users.find((u) => u.id === input.userId)
  if (!user || user.role !== "member") fail("NOT_FOUND", "Member not found.")
  const plan = db.plans.find((p) => p.id === input.planId)
  if (!plan) return fail("NOT_FOUND", "Plan not found.")
  if (plan.status !== "Active")
    fail("PLAN_ARCHIVED", "Archived plans cannot be assigned.")
  assertDates(input.startDate, input.endDate)
  assertNoOverlap(db, input.userId, input.planId, input.startDate, input.endDate)

  const [next, id] = nextId(db, "MEM")
  const membership: Membership = {
    id,
    userId: input.userId,
    planId: plan.id,
    startDate: input.startDate,
    endDate: input.endDate,
    totalVisits: plan.totalVisits,
    cancelled: null,
    renewedFrom: input.renewedFrom,
    createdAt: now,
    createdBy: actorId,
  }
  return {
    db: audit(
      { ...next, memberships: [membership, ...next.memberships] },
      actorId,
      now,
      input.renewedFrom ? "Renewed membership" : "Assigned plan",
      `${user!.name} · ${id}`,
      input.renewedFrom ? `Previous period ${input.renewedFrom}` : "",
      `${plan.name} · ${input.startDate} → ${input.endDate} · ${plan.totalVisits} visits`,
    ),
    membership,
  }
}

/** Renewal = a brand-new period with admin-chosen dates. Old usage is kept. */
export function renewMembership(
  db: Db,
  actorId: string,
  membershipId: string,
  startDate: string,
  endDate: string,
  now: string,
) {
  const m = db.memberships.find((x) => x.id === membershipId)
  if (!m) return fail("NOT_FOUND", "Membership not found.")
  return assignPlan(
    db,
    actorId,
    { userId: m.userId, planId: m.planId, startDate, endDate, renewedFrom: m.id },
    now,
  )
}

export function editMembership(
  db: Db,
  actorId: string,
  membershipId: string,
  changes: { startDate: string; endDate: string; totalVisits: number },
  reason: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  requireReason(reason)
  const m = db.memberships.find((x) => x.id === membershipId)
  if (!m) return fail("NOT_FOUND", "Membership not found.")
  assertDates(changes.startDate, changes.endDate)
  if (!Number.isInteger(changes.totalVisits) || changes.totalVisits < 1)
    fail("VISITS_MIN", "Total visits must be at least 1.")
  const used = usedVisits(db, m.id)
  if (changes.totalVisits < used)
    fail(
      "VISITS_BELOW_USED",
      `Total visits cannot be lower than visits already used (${used}).`,
    )
  assertNoOverlap(db, m.userId, m.planId, changes.startDate, changes.endDate, m.id)
  const memberships = db.memberships.map((x) =>
    x.id === m.id ? { ...x, ...changes } : x,
  )
  const user = db.users.find((u) => u.id === m.userId)
  return audit(
    { ...db, memberships },
    actorId,
    now,
    "Edited membership",
    `${user?.name} · ${m.id}`,
    `${m.startDate} → ${m.endDate} · ${m.totalVisits} visits`,
    `${changes.startDate} → ${changes.endDate} · ${changes.totalVisits} visits`,
    reason,
  )
}

export function cancelMembership(
  db: Db,
  actorId: string,
  membershipId: string,
  reason: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  requireReason(reason)
  const m = db.memberships.find((x) => x.id === membershipId)
  if (!m) return fail("NOT_FOUND", "Membership not found.")
  if (m.cancelled) fail("ALREADY_CANCELLED", "This membership is already cancelled.")
  const before = membershipStatus(db, m, mmtDate(now))
  const memberships = db.memberships.map((x) =>
    x.id === m.id ? { ...x, cancelled: { at: now, by: actorId, reason } } : x,
  )
  const user = db.users.find((u) => u.id === m.userId)
  return audit(
    { ...db, memberships },
    actorId,
    now,
    "Cancelled membership",
    `${user?.name} · ${m.id}`,
    `Status: ${before}`,
    "Status: Cancelled",
    reason,
  )
}

/* ───────────────────────── meetup sessions ───────────────────────── */

type SessionInput = Pick<MeetupSession, "planId" | "name" | "date" | "open" | "staffIds">

function assertSession(db: Db, input: SessionInput) {
  if (!input.name.trim()) fail("NAME_REQUIRED", "Session name is required.")
  if (!isValidDate(input.date)) fail("DATES_INVALID", "Please choose the meetup date.")
  if (!db.plans.some((p) => p.id === input.planId))
    fail("NOT_FOUND", "Please choose a plan.")
  const invalidStaff = input.staffIds.some(
    (id) => !db.users.some((u) => u.id === id && u.role === "staff"),
  )
  if (invalidStaff) fail("NOT_FOUND", "Assigned staff not found.")
}

export function createSession(db: Db, actorId: string, input: SessionInput, now: string) {
  requireActor(db, actorId, ["admin"])
  assertSession(db, input)
  const [next, id] = nextId(db, "SES")
  const session: MeetupSession = { ...input, name: input.name.trim(), id, createdAt: now }
  return audit(
    { ...next, sessions: [session, ...next.sessions] },
    actorId,
    now,
    "Created session",
    `${session.name} · ${session.date}`,
    "",
    session.open ? "Open" : "Closed",
  )
}

export function updateSession(
  db: Db,
  actorId: string,
  sessionId: string,
  input: SessionInput,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  assertSession(db, input)
  const s = db.sessions.find((x) => x.id === sessionId)
  if (!s) return fail("NOT_FOUND", "Session not found.")
  if (s.planId !== input.planId && db.attendance.some((a) => a.sessionId === s.id))
    fail("SESSION_IN_USE", "The plan cannot be changed after attendance was recorded.")
  const sessions = db.sessions.map((x) =>
    x.id === sessionId ? { ...x, ...input, name: input.name.trim() } : x,
  )
  const staffName = (ids: string[]) =>
    ids.map((id) => db.users.find((u) => u.id === id)?.name).join(", ") || "None"
  return audit(
    { ...db, sessions },
    actorId,
    now,
    "Updated session",
    `${s.name} · ${s.date}`,
    `${s.open ? "Open" : "Closed"} · Staff: ${staffName(s.staffIds)}`,
    `${input.open ? "Open" : "Closed"} · Staff: ${staffName(input.staffIds)}`,
  )
}

/** Sessions the scanner operator may scan for. */
export function scannableSessions(db: Db, operatorId: string) {
  const op = db.users.find((u) => u.id === operatorId)
  if (!op || op.status !== "Active") return []
  if (op.role === "admin") return db.sessions
  if (op.role === "staff") return db.sessions.filter((s) => s.staffIds.includes(op.id))
  return []
}

/* ───────────────────────── attendance ───────────────────────── */

export type ScanReject =
  | "NOT_AUTHORIZED"
  | "OFFLINE"
  | "INVALID_QR"
  | "ACCOUNT_DISABLED"
  | "SESSION_CLOSED"
  | "NO_PLAN"
  | "NOT_STARTED"
  | "EXPIRED"
  | "NO_VISITS_LEFT"
  | "CANCELLED"

export type ScanMember = { name: string; memberNo: string; photoUrl?: string }

export type CheckInResult =
  | {
      kind: "success"
      member: ScanMember
      planName: string
      sessionName: string
      checkedInAt: string
      used: number
      remaining: number
      total: number
    }
  | {
      kind: "already"
      member: ScanMember
      planName: string
      sessionName: string
      checkedInAt: string
      used: number
      remaining: number
      total: number
    }
  | { kind: "rejected"; reason: ScanReject; member?: ScanMember; detail?: string }

const toScanMember = (u: User): ScanMember => ({
  name: u.name,
  memberNo: u.memberNo,
  photoUrl: u.photoUrl,
})

/**
 * Picks the membership of `planId` that can be used on `date`, or explains why not.
 * Reason precedence follows the status precedence of the SRS.
 */
function eligibleMembership(
  db: Db,
  userId: string,
  planId: string,
  date: string,
): { membership: Membership } | { reason: ScanReject } {
  const ofPlan = db.memberships.filter((m) => m.userId === userId && m.planId === planId)
  if (!ofPlan.length) return { reason: "NO_PLAN" }
  const covering = ofPlan.filter((m) => m.startDate <= date && date <= m.endDate)
  const usable = covering.find((m) => !m.cancelled && remainingVisits(db, m) > 0)
  if (usable) return { membership: usable }
  if (covering.some((m) => m.cancelled) && covering.every((m) => m.cancelled))
    return { reason: "CANCELLED" }
  if (covering.length) return { reason: "NO_VISITS_LEFT" }
  if (ofPlan.some((m) => !m.cancelled && m.startDate > date)) return { reason: "NOT_STARTED" }
  if (ofPlan.every((m) => m.cancelled)) return { reason: "CANCELLED" }
  return { reason: "EXPIRED" }
}

function existingCheckIn(db: Db, userId: string, sessionId: string) {
  return db.attendance.find(
    (a) => a.userId === userId && a.sessionId === sessionId && !a.voided,
  )
}

/**
 * QR check-in. Must be applied atomically by the store: duplicate scans,
 * double taps and concurrent devices can never create a second record or
 * push remaining visits below zero, because the duplicate and quota checks
 * run against the latest Db inside the same step that writes the record.
 */
export function checkIn(
  db: Db,
  input: { operatorId: string; sessionId: string; qrText: string; online: boolean },
  now: string,
): { db: Db; result: CheckInResult } {
  const reject = (reason: ScanReject, user?: User, detail?: string) => ({
    db,
    result: {
      kind: "rejected" as const,
      reason,
      member: user ? toScanMember(user) : undefined,
      detail,
    },
  })

  // Never report success without a live connection.
  if (!input.online) return reject("OFFLINE")

  const session = scannableSessions(db, input.operatorId).find(
    (s) => s.id === input.sessionId,
  )
  if (!session) return reject("NOT_AUTHORIZED")

  const text = input.qrText.trim()
  const token = text.startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : ""
  const user = token ? db.users.find((u) => u.qrToken === token) : undefined
  if (!user || user.role !== "member") return reject("INVALID_QR")
  if (user.status !== "Active") return reject("ACCOUNT_DISABLED", user)
  if (!session.open) return reject("SESSION_CLOSED", user)

  const plan = db.plans.find((p) => p.id === session.planId)
  const planName = plan?.name ?? "—"

  const prior = existingCheckIn(db, user.id, session.id)
  if (prior) {
    const m = db.memberships.find((x) => x.id === prior.membershipId)!
    const used = usedVisits(db, m.id)
    return {
      db,
      result: {
        kind: "already",
        member: toScanMember(user),
        planName,
        sessionName: session.name,
        checkedInAt: prior.checkedInAt,
        used,
        remaining: m.totalVisits - used,
        total: m.totalVisits,
      },
    }
  }

  const pick = eligibleMembership(db, user.id, session.planId, mmtDate(now))
  if ("reason" in pick) return reject(pick.reason, user, planName)

  const [next, id] = nextId(db, "ATT")
  const record: Attendance = {
    id,
    membershipId: pick.membership.id,
    userId: user.id,
    planId: session.planId,
    sessionId: session.id,
    checkedInAt: now,
    method: "QR",
    recordedBy: input.operatorId,
    recordedAt: now,
    voided: null,
  }
  const after = { ...next, attendance: [record, ...next.attendance] }
  const used = usedVisits(after, pick.membership.id)
  return {
    db: after,
    result: {
      kind: "success",
      member: toScanMember(user),
      planName,
      sessionName: session.name,
      checkedInAt: now,
      used,
      remaining: pick.membership.totalVisits - used,
      total: pick.membership.totalVisits,
    },
  }
}

/**
 * Admin backfill for attendance that could not be scanned (e.g. no internet).
 * Validity is checked against the meetup date, not today.
 */
export function backfillAttendance(
  db: Db,
  actorId: string,
  input: { userId: string; sessionId: string; time: string; note: string },
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const user = db.users.find((u) => u.id === input.userId && u.role === "member")
  if (!user) return fail("NOT_FOUND", "Member not found.")
  const session = db.sessions.find((s) => s.id === input.sessionId)
  if (!session) return fail("NOT_FOUND", "Session not found.")
  const prior = existingCheckIn(db, user.id, session.id)
  if (prior)
    fail("ALREADY_CHECKED_IN", "This member is already checked in for this session.")
  const pick = eligibleMembership(db, user.id, session.planId, session.date)
  if ("reason" in pick) {
    const msg: Record<ScanReject, string> = {
      NO_PLAN: "The member has no membership for this session's plan.",
      NOT_STARTED: "The membership had not started on the meetup date.",
      EXPIRED: "The membership was expired on the meetup date.",
      NO_VISITS_LEFT: "No visits remaining on this membership.",
      CANCELLED: "The membership is cancelled.",
      NOT_AUTHORIZED: "",
      OFFLINE: "",
      INVALID_QR: "",
      ACCOUNT_DISABLED: "",
      SESSION_CLOSED: "",
    }
    return fail(pick.reason, msg[pick.reason])
  }
  const time = /^\d{2}:\d{2}$/.test(input.time) ? input.time : "00:00"
  const checkedInAt = new Date(
    Date.parse(`${session.date}T${time}:00Z`) - 6.5 * 3600 * 1000,
  ).toISOString()
  const [next, id] = nextId(db, "ATT")
  const record: Attendance = {
    id,
    membershipId: pick.membership.id,
    userId: user.id,
    planId: session.planId,
    sessionId: session.id,
    checkedInAt,
    method: "Admin",
    recordedBy: actorId,
    recordedAt: now,
    voided: null,
  }
  return audit(
    { ...next, attendance: [record, ...next.attendance] },
    actorId,
    now,
    "Backfilled attendance",
    `${user.name} · ${session.name}`,
    "",
    `${id} · attended ${session.date} ${time}`,
    input.note,
  )
}

/** Voids a wrong check-in: gives back exactly one visit, keeps the original record. */
export function voidAttendance(
  db: Db,
  actorId: string,
  attendanceId: string,
  reason: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  requireReason(reason)
  const a = db.attendance.find((x) => x.id === attendanceId)
  if (!a) return fail("NOT_FOUND", "Attendance not found.")
  if (a.voided) fail("ALREADY_VOIDED", "This attendance has already been voided.")
  const attendance = db.attendance.map((x) =>
    x.id === a.id ? { ...x, voided: { at: now, by: actorId, reason } } : x,
  )
  const user = db.users.find((u) => u.id === a.userId)
  const session = db.sessions.find((s) => s.id === a.sessionId)
  return audit(
    { ...db, attendance },
    actorId,
    now,
    "Voided attendance",
    `${user?.name} · ${session?.name} · ${a.id}`,
    "Valid",
    "Voided · 1 visit returned",
    reason,
  )
}

export function addOfflineNote(
  db: Db,
  operatorId: string,
  sessionId: string,
  note: string,
  now: string,
) {
  if (!scannableSessions(db, operatorId).some((s) => s.id === sessionId))
    fail("NOT_AUTHORIZED", "You are not assigned to this session.")
  if (!note.trim()) fail("NOTE_REQUIRED", "Please write the member's name or number.")
  const [next, id] = nextId(db, "OFF")
  return {
    ...next,
    offlineNotes: [
      { id, at: now, recordedBy: operatorId, sessionId, note: note.trim(), resolved: false },
      ...next.offlineNotes,
    ],
  }
}

export function resolveOfflineNote(
  db: Db,
  actorId: string,
  noteId: string,
  now: string,
) {
  requireActor(db, actorId, ["admin"])
  const note = db.offlineNotes.find((n) => n.id === noteId)
  if (!note) return fail("NOT_FOUND", "Offline note not found.")
  if (note.resolved) fail("ALREADY_RESOLVED", "This offline note is already resolved.")
  const next = {
    ...db,
    offlineNotes: db.offlineNotes.map((n) =>
      n.id === noteId ? { ...n, resolved: true } : n,
    ),
  }
  return audit(
    next,
    actorId,
    now,
    "Resolved offline note",
    `${note.id} · ${note.sessionId}`,
    "Unresolved",
    "Resolved",
  )
}
