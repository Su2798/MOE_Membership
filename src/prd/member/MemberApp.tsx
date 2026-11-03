import { useEffect, useState, type FormEvent, type ReactNode } from "react"

import { Link, useLocation } from "react-router"

import QRCode from "qrcode"

import {
  apply,
  useAuth,
  useDb,
  useLanguage,
  setLanguage,
} from "../../domain/store"

import { membershipSummary, qrPayload, updateProfile } from "../../domain/rules"

import { formatDateTime } from "../../domain/time"

import type { User } from "../../domain/types"

import { errorMessage } from "../../domain/store"
import { BrandLogo } from "../../components/shared/BrandLogo"
import { LocalizedContent } from "../LocalizedContent"
import { translate } from "../../i18n"
import { LanguageSwitch } from "../LanguageSwitch"
import { FormModal } from "../console/FormModal"
import { RecordPagination, useRecordPagination } from "../console/RecordPagination"

const translations = {
  en: {
    home: "Home",
    plans: "My plans",
    qr: "My QR",
    history: "Attendance",
    profile: "Profile",

    welcome: "Welcome",
    memberships: "Your memberships",
    noPlan: "No plan assigned",

    noPlanText: "Contact the MOE Page to ask about available memberships.",

    total: "Total visits",
    used: "Used",
    remaining: "Remaining",
    start: "Start date",

    end: "End date",
    status: "Status",
    upcoming: "Upcoming",
    qrTitle: "Your personal QR",

    qrText:
      "Show this QR to an authorized MOE Admin or Staff scanner. A QR alone does not record attendance.",

    historyTitle: "Attendance history",
    noAttendance: "No attendance records yet.",
    attendanceEmptyHint: "Successful check-ins will appear here.",

    profileTitle: "Profile",
    language: "Language",
    save: "Save changes",
  },

  my: {
    home: "ပင်မ",
    plans: "ကျွန်ုပ်၏အစီအစဉ်များ",
    qr: "ကျွန်ုပ်၏ QR",
    history: "တက်ရောက်မှု",
    profile: "ကိုယ်ရေးအချက်အလက်",

    welcome: "ကြိုဆိုပါသည်",
    memberships: "သင်၏အသင်းဝင်အစီအစဉ်များ",
    noPlan: "အစီအစဉ်မရှိသေးပါ",

    noPlanText: "ရရှိနိုင်သောအသင်းဝင်အစီအစဉ်များအတွက် MOE Page သို့ ဆက်သွယ်ပါ။",

    total: "စုစုပေါင်းတက်ရောက်ခွင့်",
    used: "အသုံးပြုပြီး",
    remaining: "ကျန်ရှိ",
    start: "စတင်ရက်",

    end: "ကုန်ဆုံးရက်",
    status: "အခြေအနေ",
    upcoming: "မကြာမီစတင်မည်",
    qrTitle: "သင်၏ကိုယ်ပိုင် QR",

    qrText:
      "ခွင့်ပြုထားသော MOE Admin သို့မဟုတ် Staff scanner ကို ပြသပါ။ QR တစ်ခုတည်းဖြင့် တက်ရောက်မှုမမှတ်တမ်းတင်ပါ။",

    historyTitle: "တက်ရောက်မှုမှတ်တမ်း",
    noAttendance: "တက်ရောက်မှုမှတ်တမ်း မရှိသေးပါ။",
    attendanceEmptyHint: "အောင်မြင်သောတက်ရောက်မှုများကို ဤနေရာတွင် ပြသပါမည်။",

    profileTitle: "ကိုယ်ရေးအချက်အလက်",
    language: "ဘာသာစကား",
    save: "ပြောင်းလဲမှုသိမ်းရန်",
  },
}

export function MemberApp({
  user,
  children,
}: {
  user: User

  children: ReactNode
}) {
  const { pathname } = useLocation()

  const language = useLanguage()

  const db = useDb()

  const t = translations[language]
  const tr = (text: string) => translate(text, language === "my" ? "MY" : "EN")
  const navigation = [
    {
      to: "/member",
      label: tr("My memberships"),
      tabLabel: tr("Membership"),
      page: "home",
      icon: "⌂",
    },
    {
      to: "/member/plans",
      label: tr("Membership details"),
      tabLabel: tr("Details"),
      page: "plans",
      icon: "▤",
    },
    {
      to: "/member/qr",
      label: tr("My QR"),
      tabLabel: "QR",
      page: "qr",
      icon: "▦",
    },
    {
      to: "/member/history",
      label: tr("Attendance"),
      tabLabel: tr("Attendance"),
      page: "history",
      icon: "◷",
    },
    {
      to: "/member/profile",
      label: tr("Profile"),
      tabLabel: tr("Profile"),
      page: "profile",
      icon: "○",
    },
  ]
  const currentPage =
    navigation.find((item) => item.to === pathname)?.page ?? "home"
  const [languageError, setLanguageError] = useState("")

  function changeLanguage(next: "en" | "my") {
    setLanguageError("")

    try {
      apply((current, now) =>
        updateProfile(current, user.id, user.id, { language: next }, now),
      )
      setLanguage(next)
    } catch (reason) {
      setLanguageError(errorMessage(reason))
    }
  }

  return (
    <LocalizedContent>
    <div className="prd-student-experience">
      <header className="prd-topbar prd-student-topbar">
        <div className="prd-student-header-identity">
          <Link className="prd-student-header-brand" to="/member" aria-label={tr("Membership workspace")}>
            <BrandLogo className="prd-sidebar-logo" />
          </Link>
          <span className="prd-student-brand-divider" />
          <div className="prd-topbar-identity">
            <span className="prd-eyebrow">{tr("STUDENT")}</span>
            <strong>{user.name}</strong>
          </div>
        </div>
        <div className="prd-topbar-actions">
          <nav className="prd-workspace-switch" aria-label={tr("Workspace")}>
            <Link to="/console">{tr("Admin workspace")}</Link>
            <Link className="active" to="/member" aria-current="page">
              {tr("Student mini app")}
            </Link>
          </nav>
          <LanguageSwitch language={language} onChange={changeLanguage} />
          <span className="prd-prototype-badge">
            {tr("Local prototype")} · {db.users.length} {tr("accounts")}
          </span>
        </div>
      </header>
      <main className="prd-student-preview">
        <div className="prd-student-intro">
          <div>
            <p className="prd-eyebrow">{tr("Student experience")}</p>
            <h1>{tr("A simple way to belong.")}</h1>
            <p>{tr("Explore your membership, QR access, and account details.")}</p>
          </div>
          <Link className="button button--primary" to="/signup">
            {tr("Create member account")}
          </Link>
        </div>
        {languageError && (
          <p className="prd-error" role="alert">
            {languageError}
          </p>
        )}
        <div className="prd-student-layout">
          <section className="prd-student-phone" aria-label={tr("Student mini app preview")}>
            <header className="prd-student-phone-header">
              <BrandLogo className="prd-student-phone-logo" />
              <div className="prd-student-phone-brand">
                <strong>{tr("MOE Membership")}</strong>
                <span>{tr("Telegram Mini App · Preview")}</span>
              </div>
              <LanguageSwitch
                language={language}
                onChange={changeLanguage}
              />
            </header>
            <div className="prd-student-phone-content">
              {children}
            </div>
            <nav className="prd-student-bottom-nav" aria-label={tr("Student app screens")}>
              {navigation.map((item) => (
                <Link
                  className={currentPage === item.page ? "active" : ""}
                  key={item.to}
                  to={item.to}
                  aria-current={currentPage === item.page ? "page" : undefined}
                >
                  <span className="prd-student-bottom-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="prd-student-bottom-nav-label" title={item.label}>
                    {item.tabLabel}
                  </span>
                </Link>
              ))}
            </nav>
          </section>
          <aside className="prd-student-info">
            <section className="card">
              <p className="prd-eyebrow">{tr("Designed to be simple")}</p>
              <h2>{tr("One membership. Clear access.")}</h2>
              <p>{tr("Your membership dates and visit balance are managed by MOE.")}</p>
              <ul>
                <li>{tr("Membership dates are set by Admin")}</li>
                <li>{tr("Show your personal QR to authorized MOE staff")}</li>
                <li>{tr("Visits are recorded after a successful check-in")}</li>
                <li>{tr("Review your membership and attendance history")}</li>
              </ul>
            </section>
            <p className="prd-student-disclaimer">
              {tr("Interactive UI only. Account and membership data are prototype data stored in this browser.")}
            </p>
          </aside>
        </div>
      </main>
    </div>
    </LocalizedContent>
  )
}

export function MemberPage({ page }: { page: string }) {
  const { user } = useAuth("member")

  const db = useDb()

  const language = useLanguage()

  if (!user) return null

  const memberships = db.memberships

    .filter((m) => m.userId === user.id)

    .map((m) => membershipSummary(db, m))

  const attendance = db.attendance

    .filter((a) => a.userId === user.id)

    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))

  const t = translations[language]

  const active = memberships.filter((m) => m.status === "Active")

  const title =
    page === "home"
      ? t.memberships
      : page === "plans"
        ? t.plans
        : page === "qr"
          ? t.qrTitle
          : page === "history"
            ? t.historyTitle
            : t.profileTitle

  return (
    <LocalizedContent>
    <div className="prd-page">
      <div className="prd-page-heading">
        <div>
          <p className="prd-eyebrow">
            {t.welcome}, {user.name}
          </p>
          <h1>{title}</h1>
        </div>
        {page === "home" && (
          <span className="prd-member-number">{user.memberNo}</span>
        )}
      </div>
      {page === "home" && (
        <>
          <div className="prd-stats">
            <Stat title="Plans" value={memberships.length} />
            <Stat title="Active now" value={active.length} />
            <Stat
              title="Visits remaining"
              value={active.reduce((sum, m) => sum + m.remaining, 0)}
            />
          </div>
          <PlanList
            user={user}
            summaries={memberships}
            db={db}
            emptyTitle={t.noPlan}
            emptyDescription={t.noPlanText}
          />
        </>
      )}
      {page === "plans" && (
        <PlanList
          user={user}
          summaries={memberships}
          db={db}
          emptyTitle={t.noPlan}
          emptyDescription={t.noPlanText}
        />
      )}
      {page === "qr" && <QrCard user={user} text={t.qrText} />}
      {page === "history" && (
        <AttendanceList db={db} attendance={attendance} t={t} />
      )}
      {page === "profile" && <ProfileCard user={user} />}
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

function PlanList({
  user,

  summaries,

  db,

  emptyTitle,

  emptyDescription,
}: {
  user: User

  summaries: ReturnType<typeof membershipSummary>[]

  db: ReturnType<typeof useDb>

  emptyTitle: string

  emptyDescription: string
}) {
  const pagination = useRecordPagination(summaries, user.id)

  if (!summaries.length)
    return (
      <LocalizedContent>
      <div className="prd-empty card">
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
        <QrCard
          user={user}
          text="Your personal QR is available even without a membership."
        />
      </div>
      </LocalizedContent>
    )

  return (
    <LocalizedContent>
    <div className="prd-grid">
      {pagination.pageRecords.map(({ membership, plan, used, remaining, status }) => (
        <article className="prd-plan-card card" key={membership.id}>
          <div className="prd-row">
            <span className={`prd-status ${status.toLowerCase()}`}>
              {status}
            </span>
            <span>{plan?.name ?? "Plan"}</span>
          </div>
          <p>{plan?.description}</p>
          <div className="prd-visits">
            <strong>{remaining}</strong>
            <span> / {membership.totalVisits} visits left</span>
          </div>
          <div className="prd-progress">
            <span
              style={{
                width: `${
                  membership.totalVisits
                    ? Math.min(100, (used / membership.totalVisits) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="prd-data-grid">
            <span>
              Used<strong>{used}</strong>
            </span>
            <span>
              Start date<strong>{membership.startDate}</strong>
            </span>
            <span>
              End date<strong>{membership.endDate}</strong>
            </span>
            <span>
              Status<strong>{status}</strong>
            </span>
          </div>
        </article>
      ))}
      <RecordPagination
        page={pagination.page}
        totalItems={summaries.length}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
      />
    </div>
    </LocalizedContent>
  )
}

function QrCard({ user, text }: { user: User; text: string }) {
  const [image, setImage] = useState("")

  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    QRCode.toDataURL(qrPayload(user), {
      width: 280,
      margin: 2,
      color: { dark: "#10243b", light: "#ffffff" },
    })

      .then((url) => {
        if (active) setImage(url)
      })

      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason))
      })

    return () => {
      active = false
    }
  }, [user])

  return (
    <LocalizedContent>
    <section className="prd-qr-card card">
      <div>
        <p className="prd-eyebrow">{user.memberNo}</p>
        <h2>Your personal QR</h2>
        <p>{text}</p>
      </div>
      {error ? (
        <p className="prd-error">{error}</p>
      ) : image ? (
        <img alt={`Personal QR code for ${user.name}`} src={image} />
      ) : (
        <p>Creating QR…</p>
      )}
    </section>
    </LocalizedContent>
  )
}

function AttendanceList({
  db,

  attendance,

  t,
}: {
  db: ReturnType<typeof useDb>

  attendance: ReturnType<typeof useDb>["attendance"]

  t: typeof translations["en"]
}) {
  const pagination = useRecordPagination(attendance, String(attendance.length))

  if (!attendance.length)
    return (
      <LocalizedContent>
      <div className="prd-empty prd-attendance-empty card">
        <span aria-hidden="true">◷</span>
        <h2>{t.noAttendance}</h2>
        <p>{t.attendanceEmptyHint}</p>
      </div>
      </LocalizedContent>
    )

  return (
    <LocalizedContent>
    <div className="prd-attendance-list">
      {pagination.pageRecords.map((record) => (
        <article className="prd-attendance-card card" key={record.id}>
          <div className="prd-attendance-card-top">
            <div className="prd-attendance-date">
              <span>{formatDateTime(record.checkedInAt)}</span>
            </div>
            <span
              className={`prd-status ${
                record.voided ? "cancelled" : "active"
              }`}
            >
              {record.voided ? "Voided" : "Valid"}
            </span>
          </div>
          <div className="prd-attendance-details">
            <div>
              <span>Plan</span>
              <strong>{db.plans.find((plan) => plan.id === record.planId)?.name}</strong>
            </div>
            <div>
              <span>Session</span>
              <strong>
                {db.sessions.find((session) => session.id === record.sessionId)?.name}
              </strong>
            </div>
          </div>
          <div className="prd-attendance-card-footer">
            <span className="prd-attendance-method">
              {record.method === "QR" ? "QR scan" : "Admin entry"}
            </span>
            {record.voided?.reason && (
              <span className="prd-attendance-void-reason">
                {record.voided.reason}
              </span>
            )}
          </div>
        </article>
      ))}
      <RecordPagination
        page={pagination.page}
        totalItems={attendance.length}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
      />
    </div>
    </LocalizedContent>
  )
}

function ProfileCard({ user }: { user: User }) {
  const [error, setError] = useState("")

  const [message, setMessage] = useState("")

  const [name, setName] = useState(user.name)

  const [profileOpen, setProfileOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")

    setMessage("")

    try {
      apply((current, now) =>
        updateProfile(current, user.id, user.id, { name }, now),
      )

      setMessage("Profile saved.")
      setProfileOpen(false)
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  return (
    <LocalizedContent>
    <div className="prd-profile-grid">
      <section className="card">
        <h2>Personal information</h2>
        <p>Update your name and review your account details.</p>
        {error && (
          <p className="prd-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="prd-success" role="status">
            {message}
          </p>
        )}
        <button
          className="button button--primary"
          onClick={() => setProfileOpen(true)}
          type="button"
        >
          Edit profile
        </button>
        <p className="prd-auth-foot">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <FormModal
          title="Edit profile"
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          error={error}
        >
          <form className="prd-form-grid" onSubmit={submit}>
            <label className="field">
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Phone number
              <input value={user.phone} disabled />
            </label>
            <label className="field">
              Member number
              <input value={user.memberNo} disabled />
            </label>
            <button className="button button--primary">Save profile</button>
          </form>
        </FormModal>
      </section>
    </div>
    </LocalizedContent>
  )
}
