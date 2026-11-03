/**
 * Prototype data store.
 *
 * Demo data lives in this browser's localStorage. It is not shared across
 * devices and localStorage cannot provide transactional concurrent writes.
 * Production check-ins require a server-side transaction and a unique
 * (membership, session) constraint on valid attendance.
 */
import { useSyncExternalStore } from "react"
import { DomainError } from "./rules"
import { createSeed } from "./seed"
import type { Db, Language, Role, User } from "./types"

const DB_KEY = "moe-db-v3"

function load(): Db {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(DB_KEY)
  } catch (error) {
    throw new Error(`Unable to read prototype data from local storage: ${String(error)}`)
  }
  if (raw) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      throw new Error(`Prototype data is invalid JSON and was not replaced: ${String(error)}`)
    }
    if (typeof parsed === "object" && parsed !== null && "version" in parsed && parsed.version === 3) {
      const stored = parsed as Db
      const admin = stored.users.find((user) => user.id === "USR-A1")
      if (admin?.role === "admin" && admin.name === "Daw Aye Aye") {
        const migrated: Db = {
          ...stored,
          users: stored.users.map((user) =>
            user.id === admin.id ? { ...user, name: "MOE Admin" } : user,
          ),
        }
        try {
          window.localStorage.setItem(DB_KEY, JSON.stringify(migrated))
        } catch (error) {
          throw new Error(`Unable to update the saved admin name in local storage: ${String(error)}`)
        }
        return migrated
      }
      return stored
    }
    throw new Error("Prototype data has an unsupported version and was not replaced.")
  }
  const seed = createSeed()
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(seed))
  } catch (error) {
    throw new Error(`Unable to initialize prototype data in local storage: ${String(error)}`)
  }
  return seed
}

let db: Db = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

window.addEventListener("storage", (event) => {
  if (event.key === DB_KEY || event.key?.startsWith("moe-auth") || event.key === null) {
    if (event.key === DB_KEY || event.key === null) db = load()
    authCache.clear()
    emit()
  }
})

export function getDb() {
  return db
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDb() {
  return useSyncExternalStore(subscribe, getDb)
}

/**
 * Re-reads before applying a command for convenience, but this is not a
 * cross-tab or cross-device transaction and must not be used for production.
 */
export function commit<T>(command: (current: Db, now: string) => { db: Db; value: T }): T {
  const fresh = load()
  const { db: next, value } = command(fresh, new Date().toISOString())
  if (next !== fresh) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(next))
  }
  db = next
  emit()
  return value
}

/** Shorthand for commands that only return a new Db. */
export function apply(command: (current: Db, now: string) => Db) {
  commit((current, now) => ({ db: command(current, now), value: undefined }))
}

export function resetDemoData() {
  const seed = createSeed()
  window.localStorage.setItem(DB_KEY, JSON.stringify(seed))
  db = seed
  emit()
}

export function errorMessage(error: unknown) {
  if (error instanceof DomainError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong."
}

/* ───────────────────────── authentication ───────────────────────── */

export type AppKind = "member" | "console"
type AuthRecord = { userId: string; tokenVersion: number }

const authKey = (app: AppKind) => `moe-auth-${app}`
const authCache = new Map<AppKind, AuthRecord | null>()

function readAuth(app: AppKind): AuthRecord | null {
  if (authCache.has(app)) return authCache.get(app)!
  let record: AuthRecord | null = null
  try {
    const raw = window.localStorage.getItem(authKey(app))
    if (raw) record = JSON.parse(raw) as AuthRecord
  } catch {
    record = null
  }
  authCache.set(app, record)
  return record
}

export function signIn(app: AppKind, user: User) {
  const record = { userId: user.id, tokenVersion: user.tokenVersion }
  window.localStorage.setItem(authKey(app), JSON.stringify(record))
  authCache.set(app, record)
  emit()
}

export function signOut(app: AppKind) {
  window.localStorage.removeItem(authKey(app))
  authCache.set(app, null)
  emit()
}

export const appRoles: Record<AppKind, Role[]> = {
  member: ["member"],
  console: ["admin", "staff"],
}

/**
 * Current signed-in user, or a reason why the session ended. A session ends
 * automatically when an admin resets the password or disables the account.
 */
export function useAuth(app: AppKind): {
  user: User | null
  ended: boolean
} {
  const current = useDb()
  const record = useSyncExternalStore(subscribe, () => readAuth(app))
  if (!record) return { user: null, ended: false }
  const user = current.users.find((u) => u.id === record.userId)
  const valid =
    !!user &&
    user.status === "Active" &&
    user.tokenVersion === record.tokenVersion &&
    appRoles[app].includes(user.role)
  return valid ? { user: user!, ended: false } : { user: null, ended: true }
}

/* ───────────────────────── language preference ───────────────────────── */

const LANG_KEY = "moe-language"
let language: Language =
  (window.localStorage.getItem(LANG_KEY) as Language | null) ?? "en"
const langListeners = new Set<() => void>()

export function setLanguage(next: Language) {
  language = next
  window.localStorage.setItem(LANG_KEY, next)
  langListeners.forEach((l) => l())
}

export function useLanguage() {
  return useSyncExternalStore(
    (l) => {
      langListeners.add(l)
      return () => langListeners.delete(l)
    },
    () => language,
  )
}
