import {
  Archive,
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Field, Modal, Select, TextArea } from "../../../components/shared/UI"
import type { Program } from "../../../data/mock"
import { translate } from "../../../i18n"
import { useAppState } from "../../../state/AppState"

type StatusFilter = "All" | Program["status"]
type SortKey = "recent" | "name" | "members" | "created"

const STATUS_TABS: StatusFilter[] = ["All", "Active", "Archived"]
const SORTS: Record<SortKey, string> = {
  recent: "Recently added",
  name: "Name A–Z",
  members: "Most members",
  created: "Created date",
}
const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
]

/** Parses mock dates such as "04 Sep 2024" (and "Today") into a timestamp. */
function toTime(value: string) {
  if (value.toLowerCase() === "today") return Date.now()
  const [day, month, year] = value.split(" ")
  const m = MONTHS.indexOf((month || "").slice(0, 3).toLowerCase())
  return m < 0 ? 0 : new Date(Number(year), m, Number(day)).getTime()
}

function relative(value: string, language: "EN" | "MY") {
  if (value.toLowerCase() === "today")
    return translate("Just added", language)
  const days = Math.floor((Date.now() - toTime(value)) / 86_400_000)
  if (days < 1) return translate("Today", language)
  if (days < 30)
    return `${days} ${translate("days", language)} ${translate("ago", language)}`
  const months = Math.floor(days / 30.4)
  if (months < 12)
    return `${months} ${translate("months", language)} ${translate("ago", language)}`
  const years = Math.floor(months / 12)
  return `${years} ${translate(years > 1 ? "years" : "year", language)} ${translate("ago", language)}`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")
}

export function Programs() {
  const {
    programs,
    addProgram,
    updateProgram,
    notify,
    language: appLanguage,
  } = useAppState()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("All")
  const [sort, setSort] = useState<SortKey>("recent")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [open, setOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [language, setLanguage] = useState<"English" | "Myanmar">("English")
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses the program search (unless the user is already typing)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key !== "/" || /input|textarea|select/i.test(target.tagName))
        return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const stats = useMemo(() => {
    const active = programs.filter((p) => p.status === "Active")
    const members = programs.reduce((sum, p) => sum + p.members, 0)
    const activeMembers = active.reduce((sum, p) => sum + p.members, 0)
    const largest = [...programs].sort((a, b) => b.members - a.members)[0]
    return {
      total: programs.length,
      active: active.length,
      archived: programs.length - active.length,
      members,
      activeMembers,
      largest,
      max: Math.max(1, ...programs.map((p) => p.members)),
    }
  }, [programs])

  const counts: Record<StatusFilter, number> = {
    All: stats.total,
    Active: stats.active,
    Archived: stats.archived,
  }

  const filtered = programs.filter(
    (p) =>
      `${p.name} ${p.mmName}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "All" || p.status === status),
  )

  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === "members") list.sort((a, b) => b.members - a.members)
    if (sort === "created")
      list.sort((a, b) => toTime(b.created) - toTime(a.created))
    return list
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * pageSize
  const visible = sorted.slice(start, start + pageSize)
  const isFiltered = query !== "" || status !== "All"

  function changeStatus(next: StatusFilter) {
    setStatus(next)
    setPage(1)
  }

  function changeQuery(next: string) {
    setQuery(next)
    setPage(1)
  }

  function resetFilters() {
    setQuery("")
    setStatus("All")
    setPage(1)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const changes = {
      name: String(data.get("name")),
      mmName: String(data.get("mmName")),
      description: String(data.get("description")),
      benefits: String(data.get("benefits")),
      status: String(data.get("status")) as "Active" | "Archived",
    }
    if (editingProgram) {
      updateProgram(editingProgram.id, changes)
    } else {
      addProgram(changes)
    }
    setOpen(false)
    setEditingProgram(null)
  }

  function openCreateForm() {
    setEditingProgram(null)
    setOpen(true)
  }

  function openEditForm(program: Program) {
    setEditingProgram(program)
    setOpen(true)
  }

  return (
    <div className="pg">
      {/* ── Page header ─────────────────────────────── */}
      <header className="pg-head">
        <div>
          <div className="pg-eyebrow">
            {translate("Catalog", appLanguage)} ·{" "}
            {translate("Bilingual programs", appLanguage)}
          </div>
          <h1 className="pg-title">{translate("Membership programs", appLanguage)}</h1>
          <p className="pg-lede">
            {translate(
              "Define the programs students can be invited to, with English and Myanmar names, descriptions and member benefits.",
              appLanguage,
            )}
          </p>
        </div>
        <div className="pg-actions">
          <button
            className="pg-btn pg-btn--primary"
            onClick={openCreateForm}
          >
            <Plus size={15} strokeWidth={2.25} />
            {translate("Create program", appLanguage)}
          </button>
        </div>
      </header>

      {/* ── Summary ledger ──────────────────────────── */}
      <section
        className="pg-ledger"
        aria-label={translate("Program summary", appLanguage)}
      >
        <div className="pg-stat">
          <span className="pg-stat-label">{translate("Total programs", appLanguage)}</span>
          <strong className="pg-stat-value">{stats.total}</strong>
          <span className="pg-stat-note">{translate("In this workspace", appLanguage)}</span>
        </div>
        <div className="pg-stat">
          <span className="pg-stat-label">
            <i className="pg-pip pg-pip--active" /> {translate("Active", appLanguage)}
          </span>
          <strong className="pg-stat-value">{stats.active}</strong>
          <span className="pg-stat-note">{translate("Open for new invitations", appLanguage)}</span>
        </div>
        <div className="pg-stat">
          <span className="pg-stat-label">
            <i className="pg-pip" /> {translate("Archived", appLanguage)}
          </span>
          <strong className="pg-stat-value">{stats.archived}</strong>
          <span className="pg-stat-note">{translate("Read-only, kept for records", appLanguage)}</span>
        </div>
        <div className="pg-stat">
          <span className="pg-stat-label">{translate("Enrolled members", appLanguage)}</span>
          <strong className="pg-stat-value">
            {stats.members.toLocaleString()}
          </strong>
          <div className="pg-dist" aria-hidden="true">
            {programs.map((p) => (
              <span
                key={p.id}
                title={`${p.name} · ${p.members}`}
                className={p.status === "Archived" ? "is-archived" : ""}
                style={{ flexGrow: Math.max(p.members, 1) }}
              />
            ))}
          </div>
          <span className="pg-stat-note">
            {stats.largest
              ? `${translate("Largest: ", appLanguage)}${stats.largest.name}`
              : translate("No programs yet", appLanguage)}
          </span>
        </div>
      </section>

      {/* ── Directory ───────────────────────────────── */}
      <section
        className="pg-section"
        aria-label={translate("Program directory", appLanguage)}
      >
        <div className="pg-toolbar">
          <div
            className="pg-tabs"
            role="tablist"
            aria-label={translate("Filter by status", appLanguage)}
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={status === tab}
                className={`pg-tab ${status === tab ? "is-active" : ""}`}
                onClick={() => changeStatus(tab)}
              >
                {tab === "All"
                  ? translate("All programs", appLanguage)
                  : translate(tab, appLanguage)}
                <em>{counts[tab]}</em>
              </button>
            ))}
          </div>

          <div className="pg-tools">
            <label className="pg-search">
              <Search size={15} strokeWidth={1.75} />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder={translate("Search programs…", appLanguage)}
                aria-label={translate("Search programs", appLanguage)}
              />
              {query ? (
                <button
                  className="pg-search-clear"
                  onClick={() => changeQuery("")}
                  aria-label={translate("Clear search", appLanguage)}
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </label>
            <label className="pg-sort">
              <ArrowDownUp size={14} strokeWidth={1.75} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label={translate("Sort programs", appLanguage)}
              >
                {Object.entries(SORTS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {translate(label, appLanguage)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pg-sort-caret" />
            </label>
          </div>
        </div>

        <div className="pg-table-wrap">
          <table className="pg-table">
            <colgroup>
              <col className="pg-col-program" />
              <col className="pg-col-desc" />
              <col className="pg-col-members" />
              <col className="pg-col-status" />
              <col className="pg-col-created" />
              <col className="pg-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>{translate("Program", appLanguage)}</th>
                <th>{translate("Description & benefits", appLanguage)}</th>
                <th>{translate("Members", appLanguage)}</th>
                <th>{translate("Status", appLanguage)}</th>
                <th>{translate("Created", appLanguage)}</th>
                <th>
                  <span className="pg-sr">
                    {translate("Actions", appLanguage)}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((program) => {
                const archived = program.status === "Archived"
                const benefits = program.benefits
                  .split(",")
                  .map((b) => b.trim())
                  .filter(Boolean)
                const share = stats.members
                  ? Math.round((program.members / stats.members) * 100)
                  : 0
                return (
                  <tr
                    key={program.id}
                    className={`pg-row ${archived ? "is-archived" : ""}`}
                  >
                    <td className="c-prog">
                      <div className="pg-prog">
                        <div className="pg-mono" aria-hidden="true">
                          {initials(program.name) || "P"}
                        </div>
                        <div className="pg-prog-copy">
                          <strong className="pg-name">{program.name}</strong>
                          <span className="pg-mm" lang="my">
                            {program.mmName}
                          </span>
                          <span className="pg-id">{program.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="c-desc">
                      <p className="pg-desc">{program.description}</p>
                      <div className="pg-tags">
                        {benefits.slice(0, 3).map((benefit) => (
                          <span key={benefit} className="pg-tag">
                            {benefit}
                          </span>
                        ))}
                        {benefits.length > 3 && (
                          <span className="pg-tag pg-tag--more">
                            +{benefits.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="c-mem"
                      data-label={translate("Members", appLanguage)}
                    >
                      <div className="pg-members">
                        <strong>{program.members.toLocaleString()}</strong>
                        <span>{share}%</span>
                      </div>
                      <div className="pg-bar" aria-hidden="true">
                        <i
                          style={{
                            width: `${(program.members / stats.max) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="c-status">
                      <span
                        className={`pg-status pg-status--${program.status.toLowerCase()}`}
                      >
                        <i />
                        {translate(program.status, appLanguage)}
                      </span>
                    </td>
                    <td
                      className="c-date"
                      data-label={translate("Created", appLanguage)}
                    >
                      <span className="pg-date">{program.created}</span>
                      <span className="pg-ago">
                        {relative(program.created, appLanguage)}
                      </span>
                    </td>
                    <td className="c-act">
                      <div className="pg-row-actions">
                        <button
                          className="pg-act pg-act--edit"
                          data-tip={translate("Edit", appLanguage)}
                          onClick={() => openEditForm(program)}
                          aria-label={`Edit ${program.name}`}
                        >
                          <Pencil size={14} strokeWidth={1.75} />
                          <span>{translate("Edit", appLanguage)}</span>
                        </button>
                        <button
                          className="pg-act pg-act--danger"
                          data-tip={translate("Archive", appLanguage)}
                          onClick={() => notify("Program archived")}
                          aria-label={`Archive ${program.name}`}
                        >
                          <Archive size={14} strokeWidth={1.75} />
                          <span>{translate("Archive", appLanguage)}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr className="pg-empty">
                  <td colSpan={6}>
                    <div className="pg-empty-box">
                      <div className="pg-empty-icon">
                        <SearchX size={18} strokeWidth={1.75} />
                      </div>
                      <strong>
                        {translate("No programs match your filters", appLanguage)}
                      </strong>
                      <p>
                        {translate(
                          "Try a different name, or switch the status filter to see all programs.",
                          appLanguage,
                        )}
                      </p>
                      {isFiltered && (
                        <button
                          className="pg-btn pg-btn--secondary"
                          onClick={resetFilters}
                        >
                          {translate("Clear filters", appLanguage)}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────── */}
        <footer className="pg-foot">
          <span className="pg-foot-summary">
            {sorted.length === 0 ? (
              translate("No results", appLanguage)
            ) : (
              <>
                {translate("Showing", appLanguage)}{" "}
                <b>
                  {start + 1}–{start + visible.length}
                </b>{" "}
                {translate("of", appLanguage)} <b>{sorted.length}</b>{" "}
                {translate(
                  sorted.length === 1 ? "program" : "programs",
                  appLanguage,
                )}
              </>
            )}
          </span>
          <div className="pg-foot-controls">
            <label className="pg-per-page">
              {translate("Rows", appLanguage)}
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
                aria-label={translate("Rows per page", appLanguage)}
              >
                {[5, 10, 25].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <nav
              className="pg-pager"
              aria-label={translate("Pagination", appLanguage)}
            >
              <button
                className="pg-page"
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                aria-label={translate("Previous page", appLanguage)}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`pg-page ${n === current ? "is-current" : ""}`}
                  onClick={() => setPage(n)}
                  aria-current={n === current ? "page" : undefined}
                >
                  {n}
                </button>
              ))}
              <button
                className="pg-page"
                onClick={() => setPage(current + 1)}
                disabled={current === pageCount}
                aria-label={translate("Next page", appLanguage)}
              >
                <ChevronRight size={15} />
              </button>
            </nav>
          </div>
        </footer>
      </section>

      {/* ── Create program ──────────────────────────── */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditingProgram(null)
        }}
        title={
          editingProgram
            ? "Edit membership program"
            : "New membership program"
        }
        className="pg-modal"
        actions={
          <>
            <button
              className="pg-btn pg-btn--secondary"
              onClick={() => {
                setOpen(false)
                setEditingProgram(null)
              }}
            >
              {translate("Cancel", appLanguage)}
            </button>
            <button
              type="submit"
              form="program-form"
              className="pg-btn pg-btn--primary"
            >
              {translate(
                editingProgram ? "Save program changes" : "Create program",
                appLanguage,
              )}
            </button>
          </>
        }
      >
        <form id="program-form" onSubmit={submit}>
          <div
            className="pg-seg"
            role="tablist"
            aria-label={translate("Content language", appLanguage)}
          >
            {(["English", "Myanmar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="tab"
                aria-selected={language === lang}
                className={language === lang ? "is-on" : ""}
                onClick={() => setLanguage(lang)}
              >
                {translate(lang, appLanguage)}
              </button>
            ))}
          </div>
          <div
            className={`pg-lang-panel ${
              language === "English" ? "" : "visually-muted"
            }`}
          >
            <Field
              label="Program name — English"
              name="name"
              required
              defaultValue={editingProgram?.name}
              placeholder="e.g. Advanced Learning Membership"
            />
            <TextArea
              label="Description — English"
              name="description"
              required
              rows={3}
              defaultValue={editingProgram?.description}
            />
            <TextArea
              label="Membership benefits — English"
              name="benefits"
              required
              rows={3}
              defaultValue={editingProgram?.benefits}
              placeholder="Comma-separated, e.g. Resource library, monthly mentoring"
            />
          </div>
          <div
            className={`pg-lang-panel ${
              language === "Myanmar" ? "" : "visually-muted"
            }`}
          >
            <Field
              label="Program name — Myanmar"
              name="mmName"
              required
              defaultValue={editingProgram?.mmName}
              placeholder="အစီအစဉ်အမည်"
            />
          </div>
          <Select
            label="Program status"
            name="status"
            defaultValue={editingProgram?.status ?? "Active"}
          >
            <option>Active</option>
            <option>Archived</option>
          </Select>
        </form>
      </Modal>
    </div>
  )
}
