import { useEffect, useState, type FormEvent, type ReactNode } from "react"

import {
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"

import {
  apply,
  commit,
  errorMessage,
  getDb,
  signIn,
  setLanguage,
  useLanguage,
  useAuth,
  useDb,
} from "../domain/store"

import { changePassword, login, signUp, updateProfile } from "../domain/rules"

import type { AppKind } from "../domain/store"

import type { Role } from "../domain/types"

import { translate } from "../i18n"

import { BrandLogo } from "../components/shared/BrandLogo"
import { LocalizedContent } from "./LocalizedContent"
import { LanguageSwitch } from "./LanguageSwitch"

import { ConsoleHome } from "./console/ConsoleHome"

import { ConsolePage } from "./console/ConsolePage"

import { MemberApp, MemberPage } from "./member/MemberApp"

import { ScannerPage } from "./scanner/ScannerPage"

import "./prd.css"

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="prd-frame">
      <LocalizedContent>{children}</LocalizedContent>
    </main>
  )
}

function AuthPage() {
  const [params] = useSearchParams()

  const app = params.get("app") === "console" ? "console" : "member"

  const [error, setError] = useState("")

  const [busy, setBusy] = useState(false)

  const navigate = useNavigate()

  const db = useDb()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")

    setBusy(true)

    const form = new FormData(event.currentTarget)

    try {
      const user = login(
        db,

        String(form.get("phone") ?? ""),

        String(form.get("password") ?? ""),

        app === "member" ? ["member"] : ["admin", "staff"],
      )

      signIn(app, user)

      const target = user.mustChangePassword
        ? `/change-password?app=${app}`
        : app === "member"
          ? "/member"
          : "/console"

      navigate(target, { replace: true })
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageFrame>
      <section className="prd-auth card">
        <BrandLogo className="prd-brand-mark" />
        <p className="prd-eyebrow">MEMBERSHIP SYSTEM · PROTOTYPE</p>
        <h1>{app === "member" ? "Welcome back" : "Console sign in"}</h1>
        <p className="prd-subtitle">
          Sign in with your phone number and password.
        </p>
        <form onSubmit={submit}>
          <label className="field">
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="prd-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button--primary button--wide"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {app === "member" ? (
          <>
            <p className="prd-auth-foot">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
            <p className="prd-auth-foot">
              New to MOE? <Link to="/signup">Create member account</Link>
            </p>
          </>
        ) : null}
        <p className="prd-auth-foot">
          {app === "member" ? "Staff or Admin?" : "Member?"}{" "}
          <Link to={`/login?app=${app === "member" ? "console" : "member"}`}>
            Sign in here
          </Link>
        </p>
        <details className="prd-demo-details">
          <summary>Prototype demo accounts</summary>
          <p>Admin: 09 400 000 001 / admin123</p>
          <p>Staff: 09 400 000 002 / staff123</p>
          <p>Member: 09 421 895 204 / member123</p>
        </details>
        <p className="prd-prototype-note">
          Demo only: this browser prototype stores data locally and does not
          provide production authentication or shared device data.
        </p>
      </section>
    </PageFrame>
  )
}

function SignupPage() {
  const [error, setError] = useState("")

  const navigate = useNavigate()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")

    const form = new FormData(event.currentTarget)

    const password = String(form.get("password") ?? "")

    if (password !== String(form.get("confirm") ?? "")) {
      setError("Passwords do not match.")

      return
    }

    try {
      const user = commit((db, now) => {
        const result = signUp(
          db,

          {
            name: String(form.get("name") ?? ""),

            phone: String(form.get("phone") ?? ""),

            password,
          },

          now,
        )

        return { db: result.db, value: result.user }
      })

      signIn("member", user)

      navigate("/member/qr", { replace: true })
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  return (
    <PageFrame>
      <section className="prd-auth card">
        <BrandLogo className="prd-brand-mark" />
        <p className="prd-eyebrow">MEMBER ACCOUNT</p>
        <h1>Create your account</h1>
        <p className="prd-subtitle">
          Your personal QR is created automatically.
        </p>
        <form onSubmit={submit}>
          <label className="field">
            Full name
            <input name="name" autoComplete="name" required />
          </label>
          <label className="field">
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="field">
            Confirm password
            <input
              name="confirm"
              type="password"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>
          {error && (
            <p className="prd-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button--primary button--wide">
            Create account
          </button>
        </form>
        <p className="prd-auth-foot">
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </PageFrame>
  )
}

function ForgotPasswordPage() {
  return (
    <PageFrame>
      <section className="prd-auth card">
        <BrandLogo className="prd-brand-mark" />
        <p className="prd-eyebrow">MEMBER ACCOUNT</p>
        <h1>Forgot password?</h1>
        <p className="prd-subtitle">
          For your account security, password resets are handled by an MOE
          Admin. Contact the official MOE Page and verify your identity. The
          Admin can then reset your password and provide a temporary password.
          You will need to change it the next time you sign in.
        </p>
        <p className="prd-prototype-note">
          Do not share your password or QR code when requesting help.
        </p>
        <p className="prd-auth-foot">
          <Link to="/member/profile">Back to profile</Link>
        </p>
      </section>
    </PageFrame>
  )
}

function Guard({ app, roles }: { app: AppKind; roles?: Role[] }) {
  const { user } = useAuth(app)

  const [params] = useSearchParams()

  const location = useLocation()

  if (!user)
    return (
      <Navigate
        to={`/login?app=${app}`}
        state={{ from: location.pathname }}
        replace
      />
    )

  if (roles && !roles.includes(user.role))
    return <Navigate to="/login" replace />

  if (user.mustChangePassword && location.pathname !== "/change-password")
    return <Navigate to="/change-password" replace />

  if (!user.mustChangePassword && location.pathname === "/change-password")
    return <Navigate to={app === "member" ? "/member" : "/console"} replace />

  if (params.get("app") === "console" && app === "member")
    return <Navigate to="/login?app=console" replace />

  return <Outlet />
}

function ChangePasswordPage() {
  const [params] = useSearchParams()

  const app: AppKind = params.get("app") === "console" ? "console" : "member"

  const consoleAuth = useAuth("console")

  const memberAuth = useAuth("member")

  const currentUser = app === "console" ? consoleAuth.user : memberAuth.user

  const navigate = useNavigate()

  const [error, setError] = useState("")

  if (!currentUser) return <Navigate to={`/login?app=${app}`} replace />

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const nextPassword = String(form.get("next") ?? "")

    if (nextPassword !== String(form.get("confirm") ?? "")) {
      setError("New passwords do not match.")

      return
    }

    try {
      apply((db, now) =>
        changePassword(
          db,

          currentUser!.id,

          String(form.get("current") ?? ""),

          nextPassword,

          now,
        ),
      )

      navigate(app === "member" ? "/member" : "/console", { replace: true })
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  return (
    <PageFrame>
      <section className="prd-auth card">
        <h1>Change your password</h1>
        <p className="prd-subtitle">Set a new password to continue.</p>
        <form onSubmit={submit}>
          <label className="field">
            Current password
            <input name="current" type="password" required />
          </label>
          <label className="field">
            New password
            <input name="next" type="password" minLength={6} required />
          </label>
          <label className="field">
            Confirm new password
            <input name="confirm" type="password" minLength={6} required />
          </label>
          {error && (
            <p className="prd-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button--primary button--wide">
            Save password
          </button>
        </form>
      </section>
    </PageFrame>
  )
}

function SessionShell({ kind }: { kind: "member" | "console" }) {
  const auth = useAuth(kind)

  const user = auth.user

  const { pathname } = useLocation()

  const language = useLanguage()

  const tr = (text: string) => translate(text, language === "my" ? "MY" : "EN")

  const db = useDb()

  if (!user) return null

  if (kind === "member")
    return (
      <MemberApp user={user}>
        <Outlet />
      </MemberApp>
    )

  const adminLinks = [
    ["/console", tr("Overview")],

    ["/console/users", tr("Users & staff")],

    ["/console/plans", tr("Plans")],

    ["/console/memberships", tr("Memberships")],

    ["/console/sessions", tr("Meetup sessions")],

    ["/console/scanner", tr("QR scanner")],

    ["/console/attendance", tr("Attendance")],

    ["/console/reports", tr("Reports & export")],

    ["/console/audit", tr("Audit log")],
  ]

  const links =
    user.role === "admin"
      ? adminLinks
      : [
          ["/console", tr("Assigned sessions")],
          ["/console/scanner", tr("QR scanner")],
        ]

  return (
    <div className="prd-console">
      <aside className="prd-sidebar">
        <Link className="prd-sidebar-brand" to="/console">
          <BrandLogo className="prd-sidebar-logo" />
          <strong>Membership</strong>
        </Link>
        <div className="prd-role-label">
          {tr(user.role === "admin" ? "ADMIN CONSOLE" : "STAFF CONSOLE")}
        </div>
        <nav>
          {links.map(([to, label]) => (
            <Link className={pathname === to ? "active" : ""} key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="prd-sidebar-user">
          <strong>{user.name}</strong>
          <span>{user.memberNo}</span>
        </div>
      </aside>
      <main className="prd-console-main">
        <header className="prd-topbar">
          <div className="prd-topbar-identity">
            <span className="prd-eyebrow">
              {tr(user.role === "admin" ? "ADMIN" : "STAFF")}
            </span>
            <strong>{user.name}</strong>
          </div>
          <div className="prd-topbar-actions">
            <nav className="prd-workspace-switch" aria-label={tr("Workspace")}>
              <Link className="active" to="/console" aria-current="page">
                {tr("Admin workspace")}
              </Link>
              <Link to="/member">{tr("Student mini app")}</Link>
            </nav>
            <LanguageSwitch
              language={language}
              onChange={(next) => {
                apply((current, now) =>
                  updateProfile(
                    current,
                    user.id,
                    user.id,
                    { language: next },
                    now,
                  ),
                )
                setLanguage(next)
              }}
            />
            <span className="prd-prototype-badge">
              {tr("Local prototype")} · {db.users.length} accounts
            </span>
          </div>
        </header>
        <div className="prd-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ConsoleIndex() {
  const { user } = useAuth("console")

  return user?.role === "admin" ? (
    <ConsoleHome />
  ) : (
    <ConsolePage page="assigned" />
  )
}

function RootRedirect() {
  return <Navigate to="/console" replace />
}

function PreviewRedirect() {
  const [params] = useSearchParams()
  return (
    <Navigate
      to={params.get("app") === "member" ? "/member" : "/console"}
      replace
    />
  )
}

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },

  { path: "/login", element: <PreviewRedirect /> },

  { path: "/signup", element: <SignupPage /> },

  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  { path: "/change-password", element: <PreviewRedirect /> },

  {
    element: <SessionShell kind="member" />,
    children: [
      { path: "/member", element: <MemberPage page="home" /> },

      { path: "/member/plans", element: <MemberPage page="plans" /> },

      { path: "/member/qr", element: <MemberPage page="qr" /> },

      { path: "/member/history", element: <MemberPage page="history" /> },

      { path: "/member/profile", element: <MemberPage page="profile" /> },
    ],
  },

  {
    element: <SessionShell kind="console" />,
    children: [
      { path: "/console", element: <ConsoleIndex /> },

      { path: "/console/:page", element: <ConsolePageFromRoute /> },

      { path: "/console/scanner", element: <ScannerPage /> },
    ],
  },

  { path: "*", element: <Navigate to="/console" replace /> },
])

function ConsolePageFromRoute() {
  const { page = "overview" } = useParams()

  if (page === "scanner") return <ScannerPage />

  return <ConsolePage page={page} />
}

export default function PRDApp() {
  return (
    <LanguageRoot>
      <RouterProvider router={router} />
    </LanguageRoot>
  )
}

function LanguageRoot({ children }: { children: ReactNode }) {
  const language = useLanguage()

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const db = getDb()
    const admin = db.users.find((user) => user.id === "USR-A1")
    const member = db.users.find((user) => user.id === "USR-M1")

    if (!admin || !member) {
      throw new Error("Preview accounts are missing from the prototype data.")
    }

    signIn("console", admin)
    signIn("member", member)
  }, [])

  return children
}
