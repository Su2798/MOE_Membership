import { Link } from "react-router"

import { membershipSummary } from "../../domain/rules"

import { mmtDate } from "../../domain/time"

import { useAuth, useDb, useLanguage } from "../../domain/store"

import { translate } from "../../i18n"
import { LocalizedContent } from "../LocalizedContent"
import { RecordPagination, useRecordPagination } from "./RecordPagination"

export function ConsoleHome() {
  const { user } = useAuth("console")

  const db = useDb()

  const language = useLanguage()

  const tr = (text: string) => translate(text, language === "my" ? "MY" : "EN")

  const today = mmtDate()
  const assignedSessions =
    user?.role === "admin"
      ? []
      : db.sessions.filter(
          (session) =>
            session.open && session.staffIds.includes(user?.id ?? ""),
        )
  const assignedPagination = useRecordPagination(
    assignedSessions,
    user?.id ?? "",
  )

  if (user?.role !== "admin") {
    return (
      <LocalizedContent>
      <div className="prd-page">
        <div className="prd-page-heading">
          <div>
            <p className="prd-eyebrow">{tr("STAFF")}</p>
            <h1>{tr("Assigned sessions")}</h1>
          </div>
          <Link className="button button--primary" to="/console/scanner">
            {tr("Open scanner")}
          </Link>
        </div>
        <div className="prd-grid">
          {assignedPagination.pageRecords.map((session) => (
            <article className="card prd-plan-card" key={session.id}>
              <span className="prd-status active">Open</span>
              <h2>{session.name}</h2>
              <p>{db.plans.find((plan) => plan.id === session.planId)?.name}</p>
              <p>{session.date}</p>
              <Link className="button button--primary" to="/console/scanner">
                Scan attendance
              </Link>
            </article>
          ))}
          {!assignedSessions.length && (
            <div className="card prd-empty">
              <h2>No open sessions assigned</h2>
              <p>Ask an Admin to assign you to a meetup session.</p>
            </div>
          )}
          <RecordPagination
            page={assignedPagination.page}
            totalItems={assignedSessions.length}
            totalPages={assignedPagination.totalPages}
            onPageChange={assignedPagination.setPage}
          />
        </div>
      </div>
      </LocalizedContent>
    )
  }

  const statuses = db.memberships.map((membership) =>
    membershipSummary(db, membership, today),
  )

  const activeByPlan = db.plans.map((plan) => ({
    plan,

    count: statuses.filter(
      (summary) =>
        summary.membership.planId === plan.id && summary.status === "Active",
    ).length,
  }))

  const todayAttendance = db.attendance.filter(
    (record) => mmtDate(record.checkedInAt) === today && !record.voided,
  )

  const cards = [
    [tr("Total users"), db.users.length],

    [
      tr("Active memberships"),
      statuses.filter((item) => item.status === "Active").length,
    ],

    [tr("Today's attendance"), todayAttendance.length],

    [
      tr("Expired memberships"),
      statuses.filter((item) => item.status === "Expired").length,
    ],
  ]

  return (
    <LocalizedContent>
    <div className="prd-page">
      <div className="prd-page-heading">
        <div>
          <p className="prd-eyebrow">MOE MEMBERSHIP SYSTEM</p>
          <h1>{tr("Overview")}</h1>
          <p>Live totals from the current browser prototype.</p>
        </div>
        <Link className="button button--primary" to="/console/scanner">
          {tr("Open scanner")}
        </Link>
      </div>
      <div className="prd-stats">
        {cards.map(([label, value]) => (
          <article className="prd-stat card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="prd-dashboard-grid">
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>{tr("Active members by plan")}</h2>
              <p>
                {tr("Active memberships")} {today} (Myanmar Standard Time)
              </p>
            </div>
          </div>
          {activeByPlan
            .filter((row) => row.count > 0)
            .map(({ plan, count }) => (
              <div className="prd-list-row" key={plan.id}>
                <span>{plan.name}</span>
                <strong>{count}</strong>
              </div>
            ))}
          {!activeByPlan.some((row) => row.count > 0) && (
            <p>No active memberships.</p>
          )}
        </section>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>{tr("Open sessions")}</h2>
              <p>Meetups currently open for check-in</p>
            </div>
            <Link to="/console/sessions">{tr("Manage")}</Link>
          </div>
          {db.sessions
            .filter((session) => session.open)
            .slice(0, 6)
            .map((session) => (
              <div className="prd-list-row" key={session.id}>
                <span>
                  {session.name}
                  <small>{session.date}</small>
                </span>
                <strong>
                  {
                    db.attendance.filter(
                      (a) => a.sessionId === session.id && !a.voided,
                    ).length
                  }
                </strong>
              </div>
            ))}
          {!db.sessions.some((session) => session.open) && (
            <p>No open sessions.</p>
          )}
        </section>
      </div>
      <div className="prd-quick-links">
        <Link className="card" to="/console/users">
          <strong>{tr("Manage accounts")}</strong>
          <span>Members and Staff</span>
        </Link>
        <Link className="card" to="/console/memberships">
          <strong>{tr("Assign a plan")}</strong>
          <span>Set dates per member</span>
        </Link>
        <Link className="card" to="/console/reports">
          <strong>{tr("Attendance reports")}</strong>
          <span>Filter and export records</span>
        </Link>
      </div>
    </div>
    </LocalizedContent>
  )
}
