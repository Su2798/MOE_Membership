/**
 * Demo data for the prototype. Dates are around 3 Nov 2026 and include the
 * SRS examples (User A: 2 Nov → 15 Dec, User B: 10 Nov → 20 Jan on the same plan).
 *
 * Demo logins (phone / password):
 *   Admin  09 400 000 001 / admin123
 *   Staff  09 400 000 002 / staff123   (Ko Zaw Min – Weekly Meetup #46)
 *   Staff  09 400 000 003 / staff123   (Ma Hsu – Speaking Club)
 *   Member 09 421 895 204 / member123  (Thiri Aung)
 */
import { hashPassword, randomToken } from "./rules"
import { mmtInstant } from "./time"
import type { Attendance, Db, MeetupSession, Membership, Plan, User } from "./types"

const created = mmtInstant("2026-09-01", "09:00")

function user(
  id: string,
  memberNo: string,
  name: string,
  phone: string,
  role: User["role"],
  password: string,
  extra: Partial<User> = {},
): User {
  return {
    id,
    memberNo,
    name,
    phone,
    role,
    passwordHash: hashPassword(password),
    status: "Active",
    mustChangePassword: false,
    language: "en",
    qrToken: randomToken(),
    tokenVersion: 1,
    createdAt: created,
    ...extra,
  }
}

const plan = (
  id: string,
  name: string,
  totalVisits: number,
  description: string,
  benefits: string,
  status: Plan["status"] = "Active",
): Plan => ({
  id,
  name,
  totalVisits,
  description,
  benefits,
  status,
  createdAt: created,
  updatedAt: created,
})

export function createSeed(): Db {
  const users: User[] = [
    user("USR-A1", "ADM-0001", "MOE Admin", "959400000001", "admin", "admin123"),
    user("USR-S1", "STF-0001", "Ko Zaw Min", "959400000002", "staff", "staff123"),
    user("USR-S2", "STF-0002", "Ma Hsu Hlaing", "959400000003", "staff", "staff123", {
      language: "my",
    }),
    user("USR-S3", "STF-0003", "Ko Thura Tun", "959400000004", "staff", "staff123", {
      status: "Disabled",
    }),
    user("USR-M1", "MOE-00101", "Thiri Aung", "959421895204", "member", "member123"),
    user("USR-M2", "MOE-00102", "Min Khant", "959774612398", "member", "member123", {
      language: "my",
    }),
    user("USR-M3", "MOE-00103", "Su Myat Noe", "959968421350", "member", "member123"),
    user("USR-M4", "MOE-00104", "Nay Lin Htet", "959450223118", "member", "member123", {
      status: "Disabled",
    }),
    user("USR-M5", "MOE-00105", "Hnin Wai Phyo", "959792818445", "member", "member123"),
    user("USR-M6", "MOE-00106", "Kyaw Zin Oo", "959255118730", "member", "member123"),
    user("USR-M7", "MOE-00107", "Aung Ko Ko", "959698120044", "member", "temp1234", {
      mustChangePassword: true,
    }),
  ]

  const plans: Plan[] = [
    plan(
      "PLN-W10",
      "Weekly Meetup · 10 Visits",
      10,
      "Join any 10 weekly MOE community meetups.",
      "Weekly networking meetup, Guest speaker sessions, Member community chat",
    ),
    plan(
      "PLN-S5",
      "Speaking Club · 5 Visits",
      5,
      "Five guided English speaking club sessions.",
      "Small group practice, Facilitator feedback",
    ),
    plan(
      "PLN-M4",
      "Monthly Meetup · 4 Visits",
      4,
      "Four monthly MOE meetups for members who join less often.",
      "Monthly meetup, Member community chat",
    ),
    plan(
      "PLN-L8",
      "Legacy Meetup · 8 Visits",
      8,
      "Previous meetup plan, kept for history.",
      "Weekly meetup",
      "Archived",
    ),
  ]

  const sessions: MeetupSession[] = []
  const addSession = (
    id: string,
    planId: string,
    name: string,
    date: string,
    open = false,
    staffIds: string[] = [],
  ) => {
    sessions.push({ id, planId, name, date, open, staffIds, createdAt: created })
  }
  // Weekly meetups #37 – #45 (Mondays, past) and #46 today
  const weeklyDates = [
    "2026-09-07",
    "2026-09-14",
    "2026-09-21",
    "2026-09-28",
    "2026-10-05",
    "2026-10-12",
    "2026-10-19",
    "2026-10-26",
    "2026-11-02",
  ]
  weeklyDates.forEach((d, i) =>
    addSession(`SES-W${37 + i}`, "PLN-W10", `Weekly Meetup #${37 + i}`, d, false, [
      "USR-S1",
    ]),
  )
  addSession("SES-W46", "PLN-W10", "Weekly Meetup #46", "2026-11-03", true, ["USR-S1"])
  addSession("SES-W47", "PLN-W10", "Weekly Meetup #47", "2026-11-10", false, ["USR-S1"])
  ;["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27", "2026-11-01"].forEach((d, i) =>
    addSession(`SES-S${i + 1}`, "PLN-S5", `Speaking Club #${i + 1}`, d, false, ["USR-S2"]),
  )
  addSession("SES-S6", "PLN-S5", "Speaking Club #6", "2026-11-03", true, ["USR-S2"])
  addSession("SES-MAUG", "PLN-M4", "Monthly Meetup – August", "2026-08-29")
  addSession("SES-MSEP", "PLN-M4", "Monthly Meetup – September", "2026-09-26")
  addSession("SES-MNOV", "PLN-M4", "Monthly Meetup – November", "2026-11-28", false, [
    "USR-S1",
    "USR-S2",
  ])

  const membership = (
    id: string,
    userId: string,
    planId: string,
    startDate: string,
    endDate: string,
    totalVisits: number,
    extra: Partial<Membership> = {},
  ): Membership => ({
    id,
    userId,
    planId,
    startDate,
    endDate,
    totalVisits,
    cancelled: null,
    createdAt: mmtInstant(startDate, "10:00"),
    createdBy: "USR-A1",
    ...extra,
  })

  const memberships: Membership[] = [
    // SRS example — same 10-visit plan, different personal dates
    membership("MEM-A", "USR-M1", "PLN-W10", "2026-11-02", "2026-12-15", 10),
    membership("MEM-B", "USR-M2", "PLN-W10", "2026-11-10", "2027-01-20", 10),
    // Completed: all 5 visits used, still within dates
    membership("MEM-C", "USR-M1", "PLN-S5", "2026-10-01", "2026-11-30", 5),
    // Expired with visits left
    membership("MEM-D", "USR-M5", "PLN-M4", "2026-08-01", "2026-10-31", 4),
    // Account disabled
    membership("MEM-E", "USR-M4", "PLN-S5", "2026-10-15", "2026-12-31", 5),
    // One visit left — good for testing the 10th visit / concurrent scans
    membership("MEM-F", "USR-M6", "PLN-W10", "2026-09-01", "2026-12-31", 10),
    // Cancelled by admin
    membership("MEM-G", "USR-M7", "PLN-M4", "2026-10-20", "2026-12-20", 4, {
      cancelled: {
        at: mmtInstant("2026-10-25", "11:20"),
        by: "USR-A1",
        reason: "Requested by member — refunded through Page",
      },
    }),
  ]

  const attendance: Attendance[] = []
  let n = 0
  const attend = (
    membershipId: string,
    sessionId: string,
    time = "18:10",
    extra: Partial<Attendance> = {},
  ) => {
    const m = memberships.find((x) => x.id === membershipId)!
    const s = sessions.find((x) => x.id === sessionId)!
    const at = mmtInstant(s.date, time)
    attendance.push({
      id: `ATT-${String(++n).padStart(5, "0")}`,
      membershipId,
      userId: m.userId,
      planId: m.planId,
      sessionId,
      checkedInAt: at,
      method: "QR",
      recordedBy: s.staffIds[0] ?? "USR-A1",
      recordedAt: at,
      voided: null,
      ...extra,
    })
  }

  attend("MEM-A", "SES-W45", "18:04")
  ;["SES-S1", "SES-S2", "SES-S3", "SES-S4", "SES-S5"].forEach((s) => attend("MEM-C", s))
  attend("MEM-D", "SES-MAUG")
  attend("MEM-D", "SES-MSEP", "17:55", {
    method: "Admin",
    recordedBy: "USR-A1",
    recordedAt: mmtInstant("2026-09-27", "09:30"),
  })
  weeklyDates.forEach((_, i) => attend("MEM-F", `SES-W${37 + i}`, "18:20"))
  // A wrong scan that was voided (does not count)
  attend("MEM-E", "SES-S3", "18:30", {
    voided: {
      at: mmtInstant("2026-10-21", "10:00"),
      by: "USR-A1",
      reason: "Scanned the wrong member's QR",
    },
  })

  return {
    version: 3,
    seq: 1000,
    users,
    plans,
    memberships,
    sessions,
    attendance: attendance.reverse(),
    audit: [
      {
        id: "LOG-00001",
        at: mmtInstant("2026-10-21", "10:00"),
        actorId: "USR-A1",
        action: "Voided attendance",
        target: "Nay Lin Htet · Speaking Club #3 · ATT-00018",
        before: "Valid",
        after: "Voided · 1 visit returned",
        reason: "Scanned the wrong member's QR",
      },
      {
        id: "LOG-00002",
        at: mmtInstant("2026-10-25", "11:20"),
        actorId: "USR-A1",
        action: "Cancelled membership",
        target: "Aung Ko Ko · MEM-G",
        before: "Status: Active",
        after: "Status: Cancelled",
        reason: "Requested by member — refunded through Page",
      },
    ],
    offlineNotes: [],
  }
}
