import { Outlet } from "react-router"

import { Toast } from "../components/shared/UI"

import { useAppState } from "../state/AppState"

import { StudentBottomNavigation } from "./components/StudentBottomNavigation"

import { StudentHeader } from "./components/StudentHeader"

export function StudentLayout() {
  const { toast, clearToast } = useAppState()

  return (
    <div className="mini-stage">
      <div className="mini-shell">
        <StudentHeader />
        <main className="mini-content">
          <Outlet />
        </main>
        <StudentBottomNavigation />
      </div>
      <a className="preview-switch preview-switch--mini" href="/admin">
        Admin Preview
      </a>
      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      )}
    </div>
  )
}

export function StudentBareLayout() {
  const { toast, clearToast } = useAppState()

  return (
    <div className="mini-stage">
      <div className="mini-shell mini-shell--bare">
        <main className="mini-content">
          <Outlet />
        </main>
      </div>
      <a className="preview-switch preview-switch--mini" href="/admin">
        Admin Preview
      </a>
      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      )}
    </div>
  )
}
