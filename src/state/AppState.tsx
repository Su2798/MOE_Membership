import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  initialInvitations,
  initialMemberships,
  initialPrograms,
  initialStudents,
  type Invitation,
  type Membership,
  type Program,
  type Student,
} from "../data/mock"

type Toast = { message: string; tone?: "success" | "error" }
export type AppLanguage = "EN" | "MY"
export type AdminProfile = { name: string; email: string }

const defaultAdminProfile: AdminProfile = {
  name: "MOE Admin",
  email: "ayeaye@moe.edu.mm",
}

function readAdminProfile(): AdminProfile {
  try {
    const stored = window.localStorage.getItem("moe-admin-profile")
    if (stored) {
      const profile: unknown = JSON.parse(stored)
      if (
        typeof profile === "object" &&
        profile !== null &&
        "name" in profile &&
        "email" in profile &&
        typeof profile.name === "string" &&
        typeof profile.email === "string"
      ) {
        return { name: profile.name, email: profile.email }
      }
    }
  } catch {
    return defaultAdminProfile
  }
  return defaultAdminProfile
}

function readLanguage(): AppLanguage {
  const stored = window.localStorage.getItem("moe-admin-language")
  return stored === "MY" ? "MY" : "EN"
}

export function getAdminInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase())
    .join("")
}

type AppState = {
  students: Student[]
  programs: Program[]
  invitations: Invitation[]
  memberships: Membership[]
  adminProfile: AdminProfile
  language: AppLanguage
  toast: Toast | null
  setLanguage: (language: AppLanguage) => void
  saveAdminProfile: (profile: AdminProfile) => void
  addStudent: (
    student: Omit<Student, "id" | "created" | "membershipCount" | "telegram">,
  ) => Student
  updateStudent: (id: string, changes: Partial<Student>) => void
  addProgram: (program: Omit<Program, "id" | "created" | "members">) => void
  updateProgram: (
    id: string,
    changes: Pick<
      Program,
      "name" | "mmName" | "description" | "benefits" | "status"
    >,
  ) => void
  addInvitation: (
    invitation: Omit<Invitation, "id" | "created" | "status">,
  ) => Invitation
  updateInvitation: (id: string, status: Invitation["status"]) => void
  updateMembership: (id: string, changes: Partial<Membership>) => void
  notify: (message: string, tone?: Toast["tone"]) => void
  clearToast: () => void
}

const Context = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState(initialStudents)
  const [programs, setPrograms] = useState(initialPrograms)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [memberships, setMemberships] = useState(initialMemberships)
  const [adminProfile, setAdminProfile] = useState(readAdminProfile)
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    document.documentElement.lang = language === "MY" ? "my" : "en"
  }, [language])

  const notify = (message: string, tone: Toast["tone"] = "success") => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2800)
  }

  const value = useMemo<AppState>(
    () => ({
      students,
      programs,
      invitations,
      memberships,
      adminProfile,
      language,
      toast,
      setLanguage: (nextLanguage) => {
        window.localStorage.setItem("moe-admin-language", nextLanguage)
        setLanguageState(nextLanguage)
      },
      saveAdminProfile: (profile) => {
        window.localStorage.setItem(
          "moe-admin-profile",
          JSON.stringify(profile),
        )
        setAdminProfile(profile)
        notify("Profile changes saved")
      },
      addStudent: (student) => {
        const next = {
          ...student,
          id: `STU-${1020 + students.length + 1}`,
          created: "Today",
          membershipCount: 0,
          telegram: false,
        }
        setStudents((current) => [next, ...current])
        notify("Student added successfully")
        return next
      },
      updateStudent: (id, changes) => {
        setStudents((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...changes } : item,
          ),
        )
        notify("Student record updated")
      },
      addProgram: (program) => {
        setPrograms((current) => [
          {
            ...program,
            id: `PRG-0${current.length + 1}`,
            created: "Today",
            members: 0,
          },
          ...current,
        ])
        notify("Membership program created")
      },
      updateProgram: (id, changes) => {
        setPrograms((current) =>
          current.map((program) =>
            program.id === id ? { ...program, ...changes } : program,
          ),
        )
        notify("Membership program updated")
      },
      addInvitation: (invitation) => {
        const next: Invitation = {
          ...invitation,
          id: `INV-${2048 + invitations.length}`,
          created: "Today",
          status: "Pending",
        }
        setInvitations((current) => [next, ...current])
        notify("Invitation created successfully")
        return next
      },
      updateInvitation: (id, status) => {
        setInvitations((current) =>
          current.map((item) => (item.id === id ? { ...item, status } : item)),
        )
        notify(
          status === "Revoked" ? "Invitation revoked" : "New invitation issued",
        )
      },
      updateMembership: (id, changes) => {
        setMemberships((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...changes } : item,
          ),
        )
        notify(
          changes.status === "Cancelled"
            ? "Membership cancelled"
            : "Membership renewed",
        )
      },
      notify,
      clearToast: () => setToast(null),
    }),
    [
      students,
      programs,
      invitations,
      memberships,
      adminProfile,
      language,
      toast,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAppState() {
  const value = useContext(Context)
  if (!value)
    throw new Error("useAppState must be used within AppStateProvider")
  return value
}
