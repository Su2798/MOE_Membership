import { useState } from "react"

import { Outlet, useLocation } from "react-router"

import { Toast } from "../components/shared/UI"

import { useAppState } from "../state/AppState"

import { AdminHeader } from "./components/AdminHeader"

import { AdminSidebar } from "./components/AdminSidebar"

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const { pathname } = useLocation()

  const { toast, clearToast, students, invitations } = useAppState()

  const counts = {
    students: students.length,

    invitations: invitations.filter(
      (invitation) => invitation.status === "Pending",
    ).length,
  }

  return (
    <div className={`shell ${pathname === "/admin" ? "shell--dashboard" : ""}`}>
      <AdminSidebar
        isOpen={mobileOpen}
        counts={counts}
        onClose={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <div
          className="rail-scrim"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="stage">
        <AdminHeader onOpenMenu={() => setMobileOpen(true)} />
        <div className="stage-body">
          <Outlet />
        </div>
      </main>

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      )}
    </div>
  )
}
