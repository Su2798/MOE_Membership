import { Bell, ChevronRight, Menu, Search, X } from "lucide-react"

import { useEffect, useMemo, useRef, useState } from "react"

import { useLocation, useNavigate } from "react-router"
import { BrandLogo } from "../../components/shared/BrandLogo"
import { translate } from "../../i18n"
import { getAdminInitials, useAppState } from "../../state/AppState"

const sections: Record<string, { title: string; group: string }> = {
  "": { title: "Dashboard", group: "Overview" },

  students: { title: "Students", group: "People" },

  programs: { title: "Membership Programs", group: "Catalog" },

  invitations: { title: "Invitations", group: "People" },

  memberships: { title: "Memberships", group: "People" },

  reports: { title: "Reports", group: "Insights" },

  "audit-logs": { title: "Audit Logs", group: "Insights" },

  settings: { title: "Admin Settings", group: "System" },
}

type AdminHeaderProps = {
  onOpenMenu: () => void
}

export function AdminHeader({ onOpenMenu }: AdminHeaderProps) {
  const {
    adminProfile,
    language,
    setLanguage,
    students,
    invitations,
    memberships,
    programs,
  } = useAppState()

  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const { pathname } = useLocation()

  const parts = pathname.split("/")

  const section = sections[parts[2] || ""] || sections[""]

  const detailId = parts[3]
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return []
    return [
      ...students
        .filter((item) =>
          `${item.id} ${item.name} ${item.phone}`.toLocaleLowerCase().includes(term),
        )
        .map((item) => ({
          id: item.id,
          title: item.name,
          detail: `${item.id} · ${item.phone}`,
          path: `/admin/students/${item.id}`,
          kind: "Students",
        })),
      ...memberships
        .filter((item) =>
          `${item.id} ${item.student} ${item.program} ${item.status}`
            .toLocaleLowerCase()
            .includes(term),
        )
        .map((item) => ({
          id: item.id,
          title: item.student,
          detail: `${item.id} · ${item.program}`,
          path: `/admin/memberships/${item.id}`,
          kind: "Memberships",
        })),
      ...invitations
        .filter((item) =>
          `${item.id} ${item.student} ${item.phone} ${item.program} ${item.status}`
            .toLocaleLowerCase()
            .includes(term),
        )
        .map((item) => ({
          id: item.id,
          title: item.student,
          detail: `${item.id} · ${item.program}`,
          path: `/admin/invitations/${item.id}`,
          kind: "Invitations",
        })),
      ...programs
        .filter((item) =>
          `${item.id} ${item.name} ${item.mmName} ${item.description}`
            .toLocaleLowerCase()
            .includes(term),
        )
        .map((item) => ({
          id: item.id,
          title: item.name,
          detail: `${item.id} · ${item.status}`,
          path: "/admin/programs",
          kind: "Programs",
        })),
    ].slice(0, 8)
  }, [invitations, memberships, programs, query, students])

  const goToResult = (path: string) => {
    navigate(path)
    setQuery("")
    setSearchOpen(false)
    searchRef.current?.blur()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()

        searchRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKey)

    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="masthead">
      <button
        className="masthead-menu"
        onClick={onOpenMenu}
        aria-label={translate("Open menu", language)}
      >
        <Menu size={18} />
      </button>

      <nav className="crumbs" aria-label={translate("Breadcrumb", language)}>
        <BrandLogo className="crumbs-root" />
        <ChevronRight size={13} />
        <span className="crumbs-group">
          {translate(section.group, language)}
        </span>
        <ChevronRight size={13} className="crumbs-group" />
        <span className={detailId ? "" : "crumbs-current"}>
          {translate(section.title, language)}
        </span>
        {detailId && (
          <>
            <ChevronRight size={13} />
            <span className="crumbs-current">{detailId}</span>
          </>
        )}
      </nav>

      <div className="masthead-tools">
        <div className="omnibox-wrap">
          <label className="omnibox">
            <Search size={15} strokeWidth={1.75} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false)
                if (event.key === "Enter" && results[0]) {
                  event.preventDefault()
                  goToResult(results[0].path)
                }
              }}
              placeholder={translate(
                "Search students, memberships…",
                language,
              )}
              aria-label={translate("Global search", language)}
              aria-expanded={searchOpen && query.trim().length > 0}
              aria-controls="global-search-results"
              role="combobox"
              aria-autocomplete="list"
            />
            {query ? (
              <button
                type="button"
                className="omnibox-clear"
                aria-label={translate("Clear search", language)}
                onClick={() => {
                  setQuery("")
                  setSearchOpen(true)
                  searchRef.current?.focus()
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <kbd>⌘K</kbd>
            )}
          </label>
          {searchOpen && query.trim() && (
            <div
              className="global-search-results"
              id="global-search-results"
              role="listbox"
            >
              {results.length ? (
                results.map((result) => (
                  <button
                    type="button"
                    role="option"
                    key={`${result.kind}-${result.id}`}
                    className="global-search-result"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToResult(result.path)}
                  >
                    <span>
                      <strong>{result.title}</strong>
                      <small>{result.detail}</small>
                    </span>
                    <em>{translate(result.kind, language)}</em>
                  </button>
                ))
              ) : (
                <p className="global-search-empty">
                  {translate("No results", language)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="masthead-actions">
          <div
            className="lang-toggle"
            role="group"
            aria-label={translate("Language", language)}
          >
            {(["EN", "MY"] as const).map((code) => (
              <button
                key={code}
                className={language === code ? "is-on" : ""}
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
                title={code === "EN" ? "English" : "မြန်မာ"}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            className="icon-btn bell"
            aria-label={translate("Notifications", language)}
          >
            <Bell size={17} strokeWidth={1.75} />
            <i />
          </button>

          <span className="masthead-divider" aria-hidden="true" />

          <button
            className="masthead-user"
            aria-label={translate("Account", language)}
          >
            <div className="rail-avatar rail-avatar--sm">
              {getAdminInitials(adminProfile.name)}
            </div>
            <div>
              <strong>{adminProfile.name}</strong>
              <span>{translate("Administrator", language)}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
