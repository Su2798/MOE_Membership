import { useMemo, useState, type FormEvent } from "react"

import { Link } from "react-router"

import {
  adminCreateAccount,
  assignPlan,
  backfillAttendance,
  cancelMembership,
  createPlan,
  createSession,
  editMembership,
  membershipSummary,
  regenerateQr,
  resetPassword,
  renewMembership,
  resolveOfflineNote,
  setAccountStatus,
  setPlanStatus,
  updatePlan,
  updateSession,
  voidAttendance,
} from "../../domain/rules"

import {
  apply,
  commit,
  errorMessage,
  useAuth,
  useDb,
  useLanguage,
} from "../../domain/store"

import type { MeetupSession, Plan, Role, User } from "../../domain/types"

import { formatDateTime, mmtDate } from "../../domain/time"

import { translate } from "../../i18n"
import { LocalizedContent } from "../LocalizedContent"
import { FormModal } from "./FormModal"
import { PromptDialog, type PromptRequest } from "./PromptDialog"
import { RecordPagination, useRecordPagination } from "./RecordPagination"

const pageTitles: Record<string, string> = {
  users: "Users & staff",

  plans: "Plans",

  memberships: "Memberships",

  sessions: "Meetup sessions",

  attendance: "Attendance",

  reports: "Reports & export",

  audit: "Audit log",

  assigned: "Assigned sessions",
}

export function ConsolePage({ page }: { page: string }) {
  const { user } = useAuth("console")

  const db = useDb()

  const language = useLanguage()

  const [error, setError] = useState("")

  const [message, setMessage] = useState("")

  const [prompt, setPrompt] = useState<PromptRequest | null>(null)

  const isAdmin = user?.role === "admin"

  function run(action: () => void, success = "Saved.") {
    setError("")

    setMessage("")

    try {
      action()

      setMessage(success)
      return true
    } catch (reason) {
      setError(errorMessage(reason))
      return false
    }
  }

  if (!user) return null

  if (!isAdmin && page !== "assigned") {
    return (
      <LocalizedContent>
        <section className="card prd-empty">
          <h1>Access restricted</h1>
          <p>Staff can only view assigned sessions and scan attendance.</p>
          <Link className="button button--primary" to="/console">
            View assigned sessions
          </Link>
        </section>
      </LocalizedContent>
    )
  }

  const title = translate(
    pageTitles[page] ?? "Not found",
    language === "my" ? "MY" : "EN",
  )

  return (
    <LocalizedContent>
      <div className="prd-page">
        <div className="prd-page-heading">
          <div>
            <p className="prd-eyebrow">
              {isAdmin ? "ADMIN WORKSPACE" : "STAFF WORKSPACE"}
            </p>
            <h1>{title}</h1>
          </div>
          {page === "assigned" && (
            <Link className="button button--primary" to="/console/scanner">
              Open scanner
            </Link>
          )}
        </div>
        {error && (
          <div className="prd-alert error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="prd-alert success" role="status">
            {message}
          </div>
        )}
        {page === "users" && (
          <UsersPage
            db={db}
            actor={user}
            run={run}
            error={error}
            requestPrompt={setPrompt}
          />
        )}
        {page === "plans" && (
          <PlansPage db={db} actor={user} run={run} error={error} />
        )}
        {page === "memberships" && (
          <MembershipsPage
            db={db}
            actor={user}
            run={run}
            error={error}
            requestPrompt={setPrompt}
          />
        )}
        {page === "sessions" && (
          <SessionsPage db={db} actor={user} run={run} error={error} />
        )}
        {page === "attendance" && (
          <AttendancePage
            db={db}
            actor={user}
            run={run}
            error={error}
            requestPrompt={setPrompt}
          />
        )}
        {page === "reports" && <ReportsPage db={db} />}
        {page === "audit" && <AuditPage db={db} />}
        {page === "assigned" && <AssignedPage db={db} actor={user} />}
        {!Object.prototype.hasOwnProperty.call(pageTitles, page) && (
          <div className="card prd-empty">
            <h2>Page not found</h2>
            <Link to="/console">Return to overview</Link>
          </div>
        )}
        <PromptDialog request={prompt} onClose={() => setPrompt(null)} />
      </div>
    </LocalizedContent>
  )
}

type Db = ReturnType<typeof useDb>

type Run = (action: () => void, success?: string) => boolean

function UsersPage({
  db,
  actor,
  run,
  error,
  requestPrompt,
}: {
  db: Db
  actor: User
  run: Run
  error: string
  requestPrompt: (request: PromptRequest) => void
}) {
  const [query, setQuery] = useState("")

  const [role, setRole] = useState<Role>("member")
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = db.users.filter((user) =>
    `${user.name} ${user.phone} ${user.memberNo} ${user.role}`

      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  )
  const pagination = useRecordPagination(filtered, query)

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    if (run(() => {
      commit((current, now) => {
        const result = adminCreateAccount(
          current,
          actor.id,
          {
            name: String(form.get("name") ?? ""),

            phone: String(form.get("phone") ?? ""),

            password: String(form.get("password") ?? ""),

            role,
          },
          now,
        )

        return { db: result.db, value: undefined }
      })

      event.currentTarget.reset()
    }, "Account created. Give the user the temporary password; they must change it at first sign-in.")) {
      setCreateOpen(false)
    }
  }

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <FormModal
          title="Create account"
          description="Create a member or staff account. Phone numbers must be unique, and every account receives its own QR."
          open={createOpen}
          error={error}
          onClose={() => setCreateOpen(false)}
        >
          <form autoComplete="off" className="prd-form-grid" onSubmit={add}>
            <label className="field">
              Full name
              <input autoComplete="off" name="name" required />
            </label>
            <label className="field">
              Phone number
              <input
                autoComplete="off"
                name="phone"
                type="tel"
                required
              />
            </label>
            <label className="field">
              Temporary password
              <input
                autoComplete="new-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </label>
            <label className="field">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="member">Member</option>
                <option value="staff">Staff</option>
              </select>
            </label>
            <button className="button button--primary">Create account</button>
          </form>
        </FormModal>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>
                Accounts <span className="prd-count">{db.users.length}</span>
              </h2>
            </div>
            <div className="prd-card-heading-actions">
              <input
                className="prd-filter"
                placeholder="Search name, phone, member no…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                Add account
              </button>
            </div>
          </div>
          <div className="prd-table-wrap">
            <table className="prd-table">
              <thead>
                <tr>
                  <th>Name / number</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRecords.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <strong>{person.name}</strong>
                      <small>{person.memberNo}</small>
                    </td>
                    <td>{person.phone}</td>
                    <td>{person.role}</td>
                    <td>
                      <span
                        className={`prd-status ${person.status.toLowerCase()}`}
                      >
                        {person.status}
                      </span>
                      {person.mustChangePassword && (
                        <small> · password change required</small>
                      )}
                    </td>
                    <td className="prd-actions">
                      <button
                        className="button button--secondary"
                        onClick={() => {
                          requestPrompt({
                            title: "Reset password",
                            label: `Set a temporary password for ${person.name} (minimum 6 characters):`,
                            type: "password",
                            minLength: 6,
                            submitLabel: "Reset password",
                            onSubmit: (password) =>
                              run(
                                () =>
                                  apply((current, now) =>
                                    resetPassword(
                                      current,
                                      actor.id,
                                      person.id,
                                      password,
                                      now,
                                    ),
                                  ),
                                "Password reset; active sessions were invalidated.",
                              ),
                          })
                        }}
                      >
                        Reset password
                      </button>
                      {person.role === "member" && (
                        <button
                          className="button button--secondary"
                          onClick={() => {
                            requestPrompt({
                              title: "Reissue QR",
                              label: `Reason for issuing a replacement QR to ${person.name}:`,
                              submitLabel: "Reissue QR",
                              onSubmit: (reason) =>
                                run(
                                  () =>
                                    apply((current, now) =>
                                      regenerateQr(
                                        current,
                                        actor.id,
                                        person.id,
                                        reason,
                                        now,
                                      ),
                                    ),
                                  "New QR issued. The previous QR is invalid.",
                                ),
                            })
                          }}
                        >
                          Reissue QR
                        </button>
                      )}
                      <button
                        className={`button ${
                          person.status === "Active"
                            ? "button--danger"
                            : "button--secondary"
                        }`}
                        disabled={person.id === actor.id}
                        onClick={() => {
                          const nextStatus =
                            person.status === "Active" ? "Disabled" : "Active"
                          requestPrompt({
                            title:
                              nextStatus === "Disabled"
                                ? "Disable account"
                                : "Enable account",
                            label: `Reason for ${
                              nextStatus === "Disabled"
                                ? "disabling"
                                : "enabling"
                            } this account:`,
                            submitLabel:
                              nextStatus === "Disabled" ? "Disable" : "Enable",
                            onSubmit: (reason) =>
                              run(
                                () =>
                                  apply((current, now) =>
                                    setAccountStatus(
                                      current,
                                      actor.id,
                                      person.id,
                                      nextStatus,
                                      reason,
                                      now,
                                    ),
                                  ),
                                "Account status updated.",
                              ),
                          })
                        }}
                      >
                        {person.status === "Active" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>No accounts match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={filtered.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
      </div>
    </LocalizedContent>
  )
}

function PlansPage({
  db,
  actor,
  run,
  error,
}: {
  db: Db
  actor: User
  run: Run
  error: string
}) {
  const [editing, setEditing] = useState<Plan | null>(null)

  const [includeArchived, setIncludeArchived] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const data = {
      name: String(form.get("name") ?? ""),

      description: String(form.get("description") ?? ""),

      benefits: String(form.get("benefits") ?? ""),

      totalVisits: Number(form.get("totalVisits")),
    }

    if (run(
      () => {
        if (editing)
          apply((current, now) =>
            updatePlan(current, actor.id, editing.id, data, now),
          )
        else apply((current, now) => createPlan(current, actor.id, data, now))

        setEditing(null)

        event.currentTarget.reset()
      },
      editing
        ? "Plan updated. Existing memberships retain their original quota."
        : "Plan created.",
    )) {
      setEditing(null)
      setFormOpen(false)
    }
  }

  const plans = db.plans.filter(
    (plan) => includeArchived || plan.status === "Active",
  )
  const pagination = useRecordPagination(plans, String(includeArchived))

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <FormModal
          title={editing ? "Edit plan" : "Create plan"}
          open={formOpen}
          error={error}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        >
          <p className="prd-form-dialog-description">
            Plans have visit quotas only; dates are selected per membership.
          </p>
          <form className="prd-form-grid" onSubmit={save}>
            <label className="field">
              Plan name
              <input
                key={editing?.id ?? "new-name"}
                name="name"
                defaultValue={editing?.name ?? ""}
                required
              />
            </label>
            <label className="field">
              Total visits
              <input
                key={editing?.id ?? "new-visits"}
                name="totalVisits"
                type="number"
                min={1}
                step={1}
                defaultValue={editing?.totalVisits ?? ""}
                required
              />
            </label>
            <label className="field prd-form-wide">
              Description
              <textarea
                key={editing?.id ?? "new-description"}
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </label>
            <label className="field prd-form-wide">
              Benefits
              <textarea
                key={editing?.id ?? "new-benefits"}
                name="benefits"
                defaultValue={editing?.benefits ?? ""}
              />
            </label>
            <div className="prd-form-actions">
              <button className="button button--primary">
                {editing ? "Save plan" : "Create plan"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    setFormOpen(false)
                    setEditing(null)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </FormModal>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Plans</h2>
            </div>
            <div className="prd-card-heading-actions">
              <label className="prd-inline-check">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                />{" "}
                Show archived
              </label>
              <button
                className="button button--primary"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
                type="button"
              >
                Create plan
              </button>
            </div>
          </div>
          <div className="prd-grid">
            {pagination.pageRecords.map((plan) => (
              <article className="prd-plan-card card" key={plan.id}>
                <div className="prd-row">
                  <span className={`prd-status ${plan.status.toLowerCase()}`}>
                    {plan.status}
                  </span>
                  <strong>{plan.totalVisits} visits</strong>
                </div>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="prd-card-actions">
                  <button
                    className="button button--secondary"
                    onClick={() => {
                      setEditing(plan)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="button button--secondary"
                    onClick={() =>
                      run(
                        () =>
                          apply((current, now) =>
                            setPlanStatus(
                              current,
                              actor.id,
                              plan.id,
                              plan.status === "Active" ? "Archived" : "Active",
                              now,
                            ),
                          ),
                        "Plan status updated.",
                      )
                    }
                  >
                    {plan.status === "Active" ? "Archive" : "Reactivate"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={plans.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
      </div>
    </LocalizedContent>
  )
}

function MembershipsPage({
  db,
  actor,
  run,
  error,
  requestPrompt,
}: {
  db: Db
  actor: User
  run: Run
  error: string
  requestPrompt: (request: PromptRequest) => void
}) {
  const [query, setQuery] = useState("")

  const [planFilter, setPlanFilter] = useState("all")

  const [statusFilter, setStatusFilter] = useState("all")

  const [startAfter, setStartAfter] = useState("")

  const [endBefore, setEndBefore] = useState("")

  const [assignOpen, setAssignOpen] = useState(false)

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    if (run(() => {
      apply(
        (current, now) =>
          assignPlan(
            current,
            actor.id,
            {
              userId: String(form.get("userId")),

              planId: String(form.get("planId")),

              startDate: String(form.get("startDate")),

              endDate: String(form.get("endDate")),
            },
            now,
          ).db,
      )

      event.currentTarget.reset()
    }, "Membership assigned using the selected dates.")) {
      setAssignOpen(false)
    }
  }

  const rows = db.memberships
    .map((membership) => membershipSummary(db, membership))

    .filter(
      ({ membership, user, plan, status }) =>
        (planFilter === "all" || membership.planId === planFilter) &&
        (statusFilter === "all" || status === statusFilter) &&
        (!startAfter || membership.startDate >= startAfter) &&
        (!endBefore || membership.endDate <= endBefore) &&
        `${user?.name} ${user?.phone} ${user?.memberNo} ${plan?.name} ${membership.id}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
  const pagination = useRecordPagination(
    rows,
    [query, planFilter, statusFilter, startAfter, endBefore].join("|"),
  )

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <FormModal
          title="Assign a plan"
          open={assignOpen}
          error={error}
          onClose={() => setAssignOpen(false)}
        >
          <p className="prd-form-dialog-description">
            Both dates are required. Dates are never calculated from a plan
            duration.
          </p>
          <form className="prd-form-grid" onSubmit={assign}>
            <label className="field">
              Member
              <select name="userId" required defaultValue="">
                <option value="" disabled>
                  Select member
                </option>
                {db.users
                  .filter((u) => u.role === "member")
                  .map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.name} · {u.memberNo}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Plan
              <select name="planId" required defaultValue="">
                <option value="" disabled>
                  Select active plan
                </option>
                {db.plans
                  .filter((p) => p.status === "Active")
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} · {p.totalVisits} visits
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Start date
              <input type="date" name="startDate" required />
            </label>
            <label className="field">
              End date
              <input type="date" name="endDate" required />
            </label>
            <button className="button button--primary">
              Assign membership
            </button>
          </form>
        </FormModal>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Membership records</h2>
            </div>
            <div className="prd-card-heading-actions">
              <input
                className="prd-filter"
                placeholder="Search member, plan, ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() => setAssignOpen(true)}
                type="button"
              >
                Assign membership
              </button>
            </div>
          </div>
          <div className="prd-filter-row">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">All plans</option>
              {db.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {["Active", "Upcoming", "Completed", "Expired", "Cancelled"].map(
                (status) => (
                  <option key={status}>{status}</option>
                ),
              )}
            </select>
            <label className="field">
              Start date from
              <input
                type="date"
                value={startAfter}
                onChange={(e) => setStartAfter(e.target.value)}
              />
            </label>
            <label className="field">
              End date through
              <input
                type="date"
                value={endBefore}
                onChange={(e) => setEndBefore(e.target.value)}
              />
            </label>
          </div>
          <div className="prd-table-wrap">
            <table className="prd-table">
              <thead>
                <tr>
                  <th>Member / plan</th>
                  <th>Dates</th>
                  <th>Visits used / total / left</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRecords.map(
                  ({ membership, user, plan, used, remaining, status }) => (
                    <tr key={membership.id}>
                      <td>
                        <strong>{user?.name}</strong>
                        <small>
                          {plan?.name} · {membership.id}
                        </small>
                      </td>
                      <td>
                        {membership.startDate}
                        <small>to {membership.endDate}</small>
                      </td>
                      <td>
                        {used} / {membership.totalVisits} /{" "}
                        <strong>{remaining}</strong>
                      </td>
                      <td>
                        <span className={`prd-status ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td className="prd-actions">
                        {!membership.cancelled && (
                          <MembershipEdit
                            membership={membership}
                            used={used}
                            actor={actor}
                            run={run}
                            error={error}
                          />
                        )}
                        {!membership.cancelled && (
                          <MembershipRenew
                            membership={membership}
                            actor={actor}
                            run={run}
                            error={error}
                          />
                        )}
                        {!membership.cancelled && (
                          <button
                            className="button button--danger"
                            onClick={() => {
                              requestPrompt({
                                title: "Cancel membership",
                                label: "Reason for cancelling this membership:",
                                submitLabel: "Cancel membership",
                                onSubmit: (reason) =>
                                  run(
                                    () =>
                                      apply((current, now) =>
                                        cancelMembership(
                                          current,
                                          actor.id,
                                          membership.id,
                                          reason,
                                          now,
                                        ),
                                      ),
                                    "Membership cancelled.",
                                  ),
                              })
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ),
                )}
                {!rows.length && (
                  <tr>
                    <td colSpan={5}>No memberships match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={rows.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
      </div>
    </LocalizedContent>
  )
}

function MembershipEdit({
  membership,
  used,
  actor,
  run,
  error,
}: {
  membership: Db["memberships"][number]
  used: number
  actor: User
  run: Run
  error: string
}) {
  const [open, setOpen] = useState(false)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const reason = String(form.get("reason") ?? "")

    if (run(
      () =>
        apply((db, now) =>
          editMembership(
            db,
            actor.id,
            membership.id,
            {
              startDate: String(form.get("startDate")),

              endDate: String(form.get("endDate")),

              totalVisits: Number(form.get("totalVisits")),
            },
            reason,
            now,
          ),
        ),
      "Membership updated and audited.",
    )) {
      setOpen(false)
    }
  }

  return (
    <LocalizedContent>
      <>
        <button
          className="button button--secondary"
          onClick={() => setOpen(true)}
          type="button"
        >
          Edit dates/quota
        </button>
        <FormModal
          title="Edit membership"
          open={open}
          onClose={() => setOpen(false)}
          error={error}
        >
          <form className="prd-form-grid" onSubmit={save}>
            <label className="field">
              Start date
              <input
                type="date"
                name="startDate"
                defaultValue={membership.startDate}
                required
              />
            </label>
            <label className="field">
              End date
              <input
                type="date"
                name="endDate"
                defaultValue={membership.endDate}
                required
              />
            </label>
            <label className="field">
              Total visits
              <input
                type="number"
                name="totalVisits"
                min={Math.max(1, used)}
                defaultValue={membership.totalVisits}
                required
              />
            </label>
            <label className="field">
              Reason for change
              <input name="reason" required />
            </label>
            <button className="button button--primary">Save changes</button>
          </form>
        </FormModal>
      </>
    </LocalizedContent>
  )
}

function MembershipRenew({
  membership,
  actor,
  run,
  error,
}: {
  membership: Db["memberships"][number]
  actor: User
  run: Run
  error: string
}) {
  const [open, setOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    if (run(
      () =>
        apply(
          (db, now) =>
            renewMembership(
              db,

              actor.id,

              membership.id,

              String(form.get("startDate")),

              String(form.get("endDate")),

              now,
            ).db,
        ),
      "New membership period created; previous usage remains in history.",
    )) {
      setOpen(false)
    }
  }

  return (
    <LocalizedContent>
      <>
        <button
          className="button button--secondary"
          onClick={() => setOpen(true)}
          type="button"
        >
          Renew
        </button>
        <FormModal
          title="Renew membership"
          open={open}
          onClose={() => setOpen(false)}
          error={error}
        >
          <form className="prd-form-grid" onSubmit={submit}>
            <p className="prd-form-wide">
              Choose both dates for the new period. Previous visits do not roll
              over.
            </p>
            <label className="field">
              New start date
              <input type="date" name="startDate" required />
            </label>
            <label className="field">
              New end date
              <input type="date" name="endDate" required />
            </label>
            <button className="button button--primary">Create renewal</button>
          </form>
        </FormModal>
      </>
    </LocalizedContent>
  )
}

function SessionsPage({
  db,
  actor,
  run,
  error,
}: {
  db: Db
  actor: User
  run: Run
  error: string
}) {
  const [editing, setEditing] = useState<MeetupSession | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const pagination = useRecordPagination(db.sessions, "")

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const staffIds = form.getAll("staffIds").map(String)

    const input = {
      planId: String(form.get("planId")),

      name: String(form.get("name")),

      date: String(form.get("date")),

      open: form.get("open") === "on",

      staffIds,
    }

    if (run(
      () => {
        if (editing)
          apply((current, now) =>
            updateSession(current, actor.id, editing.id, input, now),
          )
        else
          apply((current, now) => createSession(current, actor.id, input, now))

        setEditing(null)

        event.currentTarget.reset()
      },
      editing ? "Session updated." : "Meetup session created.",
    )) {
      setEditing(null)
      setFormOpen(false)
    }
  }

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <FormModal
          title={editing ? "Edit session" : "Create meetup session"}
          open={formOpen}
          error={error}
          onClose={() => {
            setEditing(null)
            setFormOpen(false)
          }}
        >
          <p className="prd-form-dialog-description">
            Sessions track attendance only; they do not reserve or book a place.
          </p>
          <form className="prd-form-grid" onSubmit={save}>
            <label className="field">
              Plan
              <select
                name="planId"
                defaultValue={editing?.planId ?? ""}
                required
              >
                <option value="" disabled>
                  Select plan
                </option>
                {db.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Session name
              <input name="name" defaultValue={editing?.name ?? ""} required />
            </label>
            <label className="field">
              Meetup date
              <input
                name="date"
                type="date"
                defaultValue={editing?.date ?? ""}
                required
              />
            </label>
            <label className="prd-inline-check">
              <input
                type="checkbox"
                name="open"
                defaultChecked={editing?.open ?? false}
              />{" "}
              Open for check-in
            </label>
            <div className="prd-form-wide">
              <strong>Assign Staff</strong>
              <div className="prd-checkbox-grid">
                {db.users
                  .filter((u) => u.role === "staff")
                  .map((staff) => (
                    <label key={staff.id} className="prd-inline-check">
                      <input
                        type="checkbox"
                        name="staffIds"
                        value={staff.id}
                        defaultChecked={
                          editing?.staffIds.includes(staff.id) ?? false
                        }
                      />
                      {staff.name} ({staff.status})
                    </label>
                  ))}
              </div>
            </div>
            <div className="prd-form-actions">
              <button className="button button--primary">
                {editing ? "Save session" : "Create session"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(false)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </FormModal>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Sessions</h2>
            </div>
            <button
              className="button button--primary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              type="button"
            >
              Create session
            </button>
          </div>
          <div className="prd-table-wrap prd-sessions-table-wrap">
            <table className="prd-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Plan / date</th>
                  <th>Assigned staff</th>
                  <th>Status</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRecords.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <strong>{session.name}</strong>
                      <small>{session.id}</small>
                    </td>
                    <td>
                      {db.plans.find((p) => p.id === session.planId)?.name}
                      <small>{session.date}</small>
                    </td>
                    <td>
                      {session.staffIds
                        .map((id) => db.users.find((u) => u.id === id)?.name)
                        .filter(Boolean)
                        .join(", ") || "None"}
                    </td>
                    <td>
                      <span
                        className={`prd-status ${
                          session.open ? "active" : "archived"
                        }`}
                      >
                        {session.open ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td>
                      {
                        db.attendance.filter(
                          (a) => a.sessionId === session.id && !a.voided,
                        ).length
                      }
                    </td>
                    <td className="prd-actions">
                      <button
                        className="button button--secondary"
                        onClick={() => {
                          setEditing(session)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="button button--secondary"
                        onClick={() =>
                          run(
                            () =>
                              apply((current, now) =>
                                updateSession(
                                  current,
                                  actor.id,
                                  session.id,
                                  { ...session, open: !session.open },
                                  now,
                                ),
                              ),
                            session.open
                              ? "Session closed."
                              : "Session opened.",
                          )
                        }
                      >
                        {session.open ? "Close" : "Open"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={db.sessions.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
      </div>
    </LocalizedContent>
  )
}

function AttendancePage({
  db,
  actor,
  run,
  error,
  requestPrompt,
}: {
  db: Db
  actor: User
  run: Run
  error: string
  requestPrompt: (request: PromptRequest) => void
}) {
  const language = useLanguage()

  const [query, setQuery] = useState("")

  const [from, setFrom] = useState("")

  const [to, setTo] = useState("")
  const [backfillOpen, setBackfillOpen] = useState(false)

  const records = db.attendance.filter((record) => {
    const member = db.users.find((u) => u.id === record.userId)

    const session = db.sessions.find((s) => s.id === record.sessionId)

    const date = mmtDate(record.checkedInAt)

    return (
      (!from || date >= from) &&
      (!to || date <= to) &&
      `${member?.name} ${member?.memberNo} ${session?.name} ${record.id}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  })
  const pagination = useRecordPagination(records, [query, from, to].join("|"))

  function backfill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    if (run(
      () =>
        apply((current, now) =>
          backfillAttendance(
            current,
            actor.id,
            {
              userId: String(form.get("userId")),

              sessionId: String(form.get("sessionId")),

              time: String(form.get("time")),

              note: String(form.get("note")),
            },
            now,
          ),
        ),
      "Attendance backfilled and audited.",
    )) {
      setBackfillOpen(false)
    }
  }

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <FormModal
          title="Admin backfill"
          open={backfillOpen}
          error={error}
          onClose={() => setBackfillOpen(false)}
        >
          <p className="prd-form-dialog-description">
            Use only when a scan could not be completed. The session date is
            checked against membership eligibility.
          </p>
          <form className="prd-form-grid" onSubmit={backfill}>
            <label className="field">
              Member
              <select name="userId" defaultValue="" required>
                <option value="" disabled>
                  Select member
                </option>
                {db.users
                  .filter((u) => u.role === "member")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.memberNo}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Session
              <select name="sessionId" defaultValue="" required>
                <option value="" disabled>
                  Select session
                </option>
                {db.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.date}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Attendance time
              <input type="time" name="time" defaultValue="00:00" required />
            </label>
            <label className="field">
              Reason / note
              <input name="note" required />
            </label>
            <button className="button button--primary">Add attendance</button>
          </form>
        </FormModal>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Attendance records</h2>
              <p>
                Voided records remain visible and are excluded from visit usage.
              </p>
            </div>
            <div className="prd-card-heading-actions">
              <input
                className="prd-filter"
                placeholder="Search member, session, ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="button button--primary"
                onClick={() => setBackfillOpen(true)}
                type="button"
              >
                Add attendance
              </button>
            </div>
          </div>
          <div className="prd-filter-row">
            <label className="field">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="field">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <div className="prd-table-wrap prd-records-table-wrap">
            <table className="prd-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan / session</th>
                  <th>Attended / recorded at</th>
                  <th>Method / state</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRecords.map((record) => {
                  const member = db.users.find((u) => u.id === record.userId)

                  const session = db.sessions.find(
                    (s) => s.id === record.sessionId,
                  )

                  return (
                    <tr key={record.id}>
                      <td>
                        <strong>{member?.name}</strong>
                        <small>{member?.memberNo}</small>
                      </td>
                      <td>
                        {db.plans.find((p) => p.id === record.planId)?.name}
                        <small>{session?.name}</small>
                      </td>
                      <td>
                        {formatDateTime(record.checkedInAt)}
                        <small>
                          Recorded {formatDateTime(record.recordedAt)} by{" "}
                          {
                            db.users.find((u) => u.id === record.recordedBy)
                              ?.name
                          }
                        </small>
                      </td>
                      <td>
                        {record.method}
                        <small>
                          <span
                            className={`prd-status ${
                              record.voided ? "cancelled" : "active"
                            }`}
                          >
                            {record.voided ? "Voided" : "Valid"}
                          </span>
                        </small>
                        {record.voided && <small>{record.voided.reason}</small>}
                      </td>
                      <td>
                        {!record.voided && (
                          <button
                            className="button button--danger"
                            onClick={() => {
                              requestPrompt({
                                title: "Void attendance",
                                label: translate(
                                  "Reason for voiding this attendance:",
                                  language === "my" ? "MY" : "EN",
                                ),
                                submitLabel: "Void attendance",
                                onSubmit: (reason) =>
                                  run(
                                    () =>
                                      apply((current, now) =>
                                        voidAttendance(
                                          current,
                                          actor.id,
                                          record.id,
                                          reason,
                                          now,
                                        ),
                                      ),
                                    "Attendance voided; one visit was returned.",
                                  ),
                              })
                            }}
                          >
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {!records.length && (
                  <tr>
                    <td colSpan={5}>
                      No attendance records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={records.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
        <OfflineNotes db={db} actor={actor} run={run} />
      </div>
    </LocalizedContent>
  )
}

function OfflineNotes({ db, actor, run }: { db: Db; actor: User; run: Run }) {
  const notes = db.offlineNotes.filter((note) => !note.resolved)
  const pagination = useRecordPagination(notes, "")

  return (
    <LocalizedContent>
      <section className="card">
        <div className="prd-card-heading">
          <div>
            <h2>Offline scan notes</h2>
            <p>
              These are not successful scans. Verify each note before
              backfilling.
            </p>
          </div>
        </div>
        {!notes.length ? (
          <p>No unresolved offline notes.</p>
        ) : (
          pagination.pageRecords.map((note) => (
            <div className="prd-list-row" key={note.id}>
              <span>
                {note.note}
                <small>
                  {db.sessions.find((s) => s.id === note.sessionId)?.name} ·{" "}
                  {formatDateTime(note.at)} ·{" "}
                  {db.users.find((u) => u.id === note.recordedBy)?.name}
                </small>
              </span>
              <button
                className="button button--secondary"
                onClick={() =>
                  run(
                    () =>
                      apply((current, now) =>
                        resolveOfflineNote(current, actor.id, note.id, now),
                      ),
                    "Offline note marked resolved.",
                  )
                }
              >
                Resolve note
              </button>
            </div>
          ))
        )}
        <RecordPagination
          page={pagination.page}
          totalItems={notes.length}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </section>
    </LocalizedContent>
  )
}

function ReportsPage({ db }: { db: Db }) {
  const language = useLanguage()

  const [query, setQuery] = useState("")

  const [planId, setPlanId] = useState("all")

  const [sessionId, setSessionId] = useState("all")

  const [from, setFrom] = useState("")

  const [to, setTo] = useState("")

  const rows = useMemo(
    () =>
      db.attendance.filter((record) => {
        const member = db.users.find((u) => u.id === record.userId)

        const session = db.sessions.find((s) => s.id === record.sessionId)

        const date = mmtDate(record.checkedInAt)

        return (
          (planId === "all" || record.planId === planId) &&
          (sessionId === "all" || record.sessionId === sessionId) &&
          (!from || date >= from) &&
          (!to || date <= to) &&
          `${member?.name} ${member?.phone} ${member?.memberNo} ${session?.name}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      }),
    [db.attendance, db.users, db.sessions, planId, sessionId, from, to, query],
  )
  const pagination = useRecordPagination(
    rows,
    [query, planId, sessionId, from, to].join("|"),
  )

  const memberships = db.memberships.map((membership) =>
    membershipSummary(db, membership),
  )

  const exportCsv = () => {
    const values = [
      [
        "Member",
        "Phone",
        "Member number",
        "Plan",
        "Session",
        "Attendance date/time",
        "Method",
        "Status",
        "Recorded by",
        "Recorded at",
      ].map((text) => translate(text, language === "my" ? "MY" : "EN")),

      ...rows.map((record) => [
        db.users.find((u) => u.id === record.userId)?.name ?? "",

        db.users.find((u) => u.id === record.userId)?.phone ?? "",

        db.users.find((u) => u.id === record.userId)?.memberNo ?? "",

        db.plans.find((p) => p.id === record.planId)?.name ?? "",

        db.sessions.find((s) => s.id === record.sessionId)?.name ?? "",

        record.checkedInAt,

        record.method,

        translate(
          record.voided ? "Voided" : "Valid",
          language === "my" ? "MY" : "EN",
        ),

        db.users.find((u) => u.id === record.recordedBy)?.name ?? "",

        record.recordedAt,
      ]),
    ]

    const csv = values.map((row) => row.map(csvCell).join(",")).join("\r\n")

    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
    )

    const link = document.createElement("a")

    link.href = url

    link.download = "moe-attendance-report.csv"

    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <LocalizedContent>
      <div className="prd-page-stack">
        <div className="prd-stats">
          <Stat title="Attendance records" value={rows.length} />
          <Stat
            title="Valid check-ins"
            value={rows.filter((r) => !r.voided).length}
          />
          <Stat
            title="Expired memberships"
            value={memberships.filter((m) => m.status === "Expired").length}
          />
          <Stat
            title="Completed memberships"
            value={memberships.filter((m) => m.status === "Completed").length}
          />
        </div>
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Attendance report</h2>
              <p>
                CSV export is compatible with Excel. No payment data is
                included.
              </p>
            </div>
            <button className="button button--primary" onClick={exportCsv}>
              Export CSV for Excel
            </button>
          </div>
          <div className="prd-filter-row">
            <input
              className="prd-filter"
              placeholder="Name, phone, member no, session…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="all">All plans</option>
              {db.plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="all">All sessions</option>
              {db.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
            <label className="field">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="field">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <div className="prd-table-wrap prd-records-table-wrap">
            <table className="prd-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan / session</th>
                  <th>Attended</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {db.users.find((u) => u.id === record.userId)?.name}
                      <small>
                        {db.users.find((u) => u.id === record.userId)?.memberNo}
                      </small>
                    </td>
                    <td>
                      {db.plans.find((p) => p.id === record.planId)?.name}
                      <small>
                        {
                          db.sessions.find((s) => s.id === record.sessionId)
                            ?.name
                        }
                      </small>
                    </td>
                    <td>{formatDateTime(record.checkedInAt)}</td>
                    <td>{record.method}</td>
                    <td>{record.voided ? "Voided" : "Valid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <RecordPagination
            page={pagination.page}
            totalItems={rows.length}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </section>
      </div>
    </LocalizedContent>
  )
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <LocalizedContent>
      <article className="prd-stat card">
        <span>{title}</span>
        <strong>{value}</strong>
      </article>
    </LocalizedContent>
  )
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function AuditPage({ db }: { db: Db }) {
  const [query, setQuery] = useState("")

  const [from, setFrom] = useState("")

  const [to, setTo] = useState("")

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const entries = db.audit.filter((entry) => {
    const auditText =
      `${entry.action} ${entry.target} ${entry.before} ${entry.after} ${entry.reason}`
    const normalizedAuditText = auditText.toLocaleLowerCase()
    const actor = db.users.find((user) => user.id === entry.actorId)
    const memberNames = db.users
      .filter(
        (user) =>
          user.role === "member" &&
          (normalizedAuditText.includes(user.name.toLocaleLowerCase()) ||
            normalizedAuditText.includes(user.memberNo.toLocaleLowerCase())),
      )
      .map((user) => user.name)

    return (
      (!from || mmtDate(entry.at) >= from) &&
      (!to || mmtDate(entry.at) <= to) &&
      `${auditText} ${entry.actorId} ${actor?.name ?? ""} ${memberNames.join(" ")}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )
  })
  const pagination = useRecordPagination(entries, [query, from, to].join("|"))

  return (
    <LocalizedContent>
      <section className="card">
        <div className="prd-card-heading">
          <div>
            <h2>System activity</h2>
            <p>Passwords and QR secrets are not included in audit details.</p>
          </div>
        </div>
        <div className="prd-filter-row">
          <input
            className="prd-filter"
            placeholder="Search actor, member name, action, target…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="field">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <div className="prd-table-wrap prd-records-table-wrap">
          <table className="prd-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action / target</th>
                <th>Before → after</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageRecords.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.at)}</td>
                  <td>
                    {db.users.find((u) => u.id === entry.actorId)?.name ??
                      entry.actorId}
                  </td>
                  <td>
                    <strong>{entry.action}</strong>
                    <small>{entry.target}</small>
                  </td>
                  <td>
                    {entry.before}
                    <small>{entry.after}</small>
                  </td>
                  <td>{entry.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RecordPagination
          page={pagination.page}
          totalItems={entries.length}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </section>
    </LocalizedContent>
  )
}

function AssignedPage({ db, actor }: { db: Db; actor: User }) {
  const assigned = db.sessions.filter((session) =>
    session.staffIds.includes(actor.id),
  )
  const pagination = useRecordPagination(assigned, actor.id)

  return (
    <LocalizedContent>
      <div className="prd-grid">
        {pagination.pageRecords.map((session) => (
          <article className="card prd-plan-card" key={session.id}>
            <div className="prd-row">
              <span
                className={`prd-status ${session.open ? "active" : "archived"}`}
              >
                {session.open ? "Open" : "Closed"}
              </span>
              <span>{session.date}</span>
            </div>
            <h2>{session.name}</h2>
            <p>{db.plans.find((plan) => plan.id === session.planId)?.name}</p>
            <p>
              {
                db.attendance.filter(
                  (a) => a.sessionId === session.id && !a.voided,
                ).length
              }{" "}
              valid check-ins
            </p>
            <Link className="button button--primary" to="/console/scanner">
              Open scanner
            </Link>
          </article>
        ))}
        {!assigned.length && (
          <div className="card prd-empty">
            <h2>No assigned sessions</h2>
            <p>Ask an Admin to assign you to a session.</p>
          </div>
        )}
        <RecordPagination
          page={pagination.page}
          totalItems={assigned.length}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </div>
    </LocalizedContent>
  )
}
