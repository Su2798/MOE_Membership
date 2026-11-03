import {
  CheckCircle2,
  Download,
  KeyRound,
  Languages,
  ShieldCheck,
  UserCog,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import {
  Button,
  Card,
  DataTable,
  Field,
  PageTitle,
  SearchBar,
  Select,
  StatusBadge,
} from "../../../components/shared/UI"
import { translate } from "../../../i18n"
import { getAdminInitials, useAppState } from "../../../state/AppState"
import { isWithinDateRange } from "../../../utils/date"

export function Reports() {
  const { memberships, invitations, programs, students, notify, language } =
    useAppState()
  const [applied, setApplied] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [programFilter, setProgramFilter] = useState("All programs")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const filteredMemberships = memberships.filter(
    (membership) =>
      (!applied ||
        isWithinDateRange(membership.start, dateFrom, dateTo)) &&
      (!applied ||
        programFilter === "All programs" ||
        membership.program === programFilter) &&
      (!applied ||
        statusFilter === "All statuses" ||
        membership.status === statusFilter),
  )
  const reportStats = [
    ["Total students", students.length, "Students in this dataset"],
    [
      "Active memberships",
      filteredMemberships.filter((item) => item.status === "Active").length,
      "Matching current filters",
    ],
    [
      "Expired memberships",
      filteredMemberships.filter((item) => item.status === "Expired").length,
      "Matching current filters",
    ],
    [
      "Pending invitations",
      invitations.filter((item) => item.status === "Pending").length,
      "Across all programs",
    ],
  ]
  const statusCounts = ["Active", "Upcoming", "Expired", "Cancelled"].map(
    (status) => ({
      status,
      count: filteredMemberships.filter((item) => item.status === status)
        .length,
    }),
  )
  const membershipTotal = filteredMemberships.length
  return (
    <>
      <PageTitle
        title="Reports"
        description="Analyze student, membership, and invitation performance."
        actions={
          <Button
            variant="secondary"
            icon={<Download size={17} />}
            onClick={() => {
              notify("Excel export is being prepared")
              window.setTimeout(
                () => notify("MOE-report-Jan-2025.xlsx is ready"),
                900,
              )
            }}
          >
            Export Excel
          </Button>
        }
      />
      <Card className="report-filters">
        <div className="form-grid form-grid--four">
          <Field
            label="Date from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Field
            label="Date to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
          <Select
            label="Membership program"
            value={programFilter}
            onChange={(event) => setProgramFilter(event.target.value)}
          >
            <option>All programs</option>
            {programs.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select
            label="Membership status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Upcoming</option>
            <option>Expired</option>
            <option>Cancelled</option>
          </Select>
        </div>
        <div className="filter-actions">
          <Button
            variant="ghost"
            onClick={() => {
              setDateFrom("")
              setDateTo("")
              setProgramFilter("All programs")
              setStatusFilter("All statuses")
              setApplied(false)
            }}
          >
            Reset
          </Button>
          <Button onClick={() => setApplied(true)}>Apply filters</Button>
        </div>
      </Card>
      {applied && (
        <div className="applied-banner">
          <CheckCircle2 size={18} />{" "}
          {translate("Filters applied — showing", language)}{" "}
          {filteredMemberships.length}{" "}
          {translate("matching membership records", language)}
        </div>
      )}
      <div className="stats-grid stats-grid--reports">
        {reportStats.map(([label, value, trend]) => (
          <Card className="report-stat" key={label}>
            <span>{translate(String(label), language)}</span>
            <strong>{value}</strong>
            <small>{translate(String(trend), language)}</small>
          </Card>
        ))}
      </div>
      <div className="dashboard-grid">
        <Card>
          <div className="card-heading">
            <div>
              <h2>{translate("Membership status", language)}</h2>
              <p>{translate("Distribution across all programs", language)}</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>{membershipTotal}</strong>
                <span>{translate("Total", language)}</span>
              </div>
            </div>
            <div className="legend">
              {statusCounts.map(({ status, count }) => (
                <div key={status}>
                  <StatusBadge status={status} />
                  <strong>
                    {membershipTotal
                      ? `${Math.round((count / membershipTotal) * 100)}%`
                      : "0%"}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h2>{translate("Invitation conversion", language)}</h2>
              <p>{translate("Last 30 days", language)}</p>
            </div>
          </div>
          <div className="bar-report">
            {[
              ["Redeemed", 72],
              ["Pending", 18],
              ["Expired", 7],
              ["Revoked", 3],
            ].map(([label, val]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${val}%` }} />
                </div>
                <strong>{val}%</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <div className="card-heading">
          <div>
            <h2>{translate("Report data", language)}</h2>
            <p>
              {translate("Membership records matching current filters", language)}
            </p>
          </div>
        </div>
        <DataTable
          columns={[
            "Membership ID",
            "Student",
            "Program",
            "Status",
            "Start",
            "Expiry",
          ]}
        >
          {filteredMemberships.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.student}</td>
              <td>{translate(m.program, language)}</td>
              <td>
                <StatusBadge status={m.status} />
              </td>
              <td>{m.start}</td>
              <td>{m.expiry}</td>
            </tr>
          ))}
        </DataTable>
        <div className="report-foot">
          {invitations.length}{" "}
          {translate("invitations included in this reporting period", language)}
        </div>
      </Card>
    </>
  )
}

export function AuditLogs() {
  const { language } = useAppState()
  const [query, setQuery] = useState("")
  const [date, setDate] = useState("")
  const logs = [
    [
      "MOE Admin",
      "Renewed membership",
      "Thiri Aung · MEM-82941",
      "Expiry: 31 Dec 2025",
      "Expiry: 31 Dec 2026",
      "24 Jan 2025, 10:42",
    ],
    [
      "Ko Zaw Min",
      "Updated student",
      "Min Khant · STU-1023",
      "Language: English",
      "Language: မြန်မာ",
      "24 Jan 2025, 09:18",
    ],
    [
      "MOE Admin",
      "Revoked invitation",
      "Nay Lin Htet · INV-2045",
      "Status: Pending",
      "Status: Revoked",
      "23 Jan 2025, 16:22",
    ],
    [
      "Admin Team",
      "Created program",
      "Career Accelerator",
      "—",
      "Status: Active",
      "22 Jan 2025, 14:06",
    ],
  ].filter(
    (row) =>
      row.join(" ").toLowerCase().includes(query.toLowerCase()) &&
      (!date || isWithinDateRange(row[5], date, date)),
  )
  return (
    <>
      <PageTitle
        title="Audit logs"
        description="Review administrative changes and sensitive actions."
      />
      <Card>
        <div className="filters">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search admin, action, or record"
          />
          <Field
            label=""
            type="date"
            aria-label="Filter audit date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <DataTable
          columns={[
            "Admin",
            "Action performed",
            "Related record",
            "Previous value",
            "Updated value",
            "Timestamp",
          ]}
        >
          {logs.map((row) => (
            <tr key={row.join()}>
              {row.map((cell, i) => (
                <td key={cell}>
                  {i === 0 ? (
                    <strong>{cell}</strong>
                  ) : i === 1 ? (
                    <strong>{translate(cell, language)}</strong>
                  ) : (
                    translate(cell, language)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  )
}

export function Settings() {
  const { notify, adminProfile, saveAdminProfile, language, setLanguage } =
    useAppState()
  const [section, setSection] = useState("profile")
  const [name, setName] = useState(adminProfile.name)
  const [email, setEmail] = useState(adminProfile.email)

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      saveAdminProfile({ name: name.trim(), email: email.trim() })
    } catch {
      notify("Could not save profile changes", "error")
    }
  }

  return (
    <>
      <PageTitle
        title="Admin settings"
        description="Manage your profile, preferences, security, and administrator access."
      />
      <div className="settings-layout">
        <Card className="settings-nav">
          {[
            ["profile", UserCog, "Admin profile"],
            ["language", Languages, "Language preference"],
            ["security", KeyRound, "Account security"],
            ["admins", ShieldCheck, "Admin management"],
          ].map(([id, Icon, label]) => (
            <button
              key={String(id)}
              className={section === id ? "active" : ""}
              onClick={() => setSection(String(id))}
            >
              <Icon size={18} />
              {String(label)}
            </button>
          ))}
        </Card>
        <Card className="settings-panel">
          {section === "profile" && (
            <>
              <h2>{translate("Admin profile", language)}</h2>
              <p>
                {translate(
                  "Update the information shown to other administrators.",
                  language,
                )}
              </p>
              <div className="settings-avatar">
                <div className="profile-avatar">{getAdminInitials(name)}</div>
                <div>
                  <strong>
                    {name || translate("Admin name", language)}
                  </strong>
                  <span>{translate("Super Administrator", language)}</span>
                </div>
              </div>
              <form onSubmit={saveProfile}>
                <div className="form-grid">
                  <Field
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <Field
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={!name.trim() || !email.trim()}>
                  Save changes
                </Button>
              </form>
            </>
          )}
          {section === "language" && (
            <>
              <h2>{translate("Language preference", language)}</h2>
              <p>
                {translate(
                  "Select the default language for your admin dashboard.",
                  language,
                )}
              </p>
              <div className="language-options">
                <label>
                  <input
                    type="radio"
                    name="language"
                    value="EN"
                    checked={language === "EN"}
                    onChange={() => setLanguage("EN")}
                  />
                  <span>
                    <strong>{translate("English", language)}</strong>
                    <small>
                      {translate("Use the dashboard in English", language)}
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="language"
                    value="MY"
                    checked={language === "MY"}
                    onChange={() => setLanguage("MY")}
                  />
                  <span>
                    <strong>မြန်မာ</strong>
                    <small>
                      {translate(
                        "Dashboard ကို မြန်မာဘာသာဖြင့် သုံးပါ",
                        language,
                      )}
                    </small>
                  </span>
                </label>
              </div>
              <Button onClick={() => notify("Language preference saved")}>
                Save preference
              </Button>
            </>
          )}
          {section === "security" && (
            <>
              <h2>{translate("Account security", language)}</h2>
              <p>
                {translate(
                  "Keep your administrator account protected.",
                  language,
                )}
              </p>
              <Field label="Current password" type="password" />
              <div className="form-grid">
                <Field label="New password" type="password" />
                <Field label="Confirm new password" type="password" />
              </div>
              <Button onClick={() => notify("Password updated securely")}>
                Update password
              </Button>
            </>
          )}
          {section === "admins" && (
            <>
              <div className="card-heading">
                <div>
                  <h2>{translate("Admin management", language)}</h2>
                  <p>
                    {translate(
                      "Control who can manage MOE memberships.",
                      language,
                    )}
                  </p>
                </div>
                <Button onClick={() => notify("Admin invitation sent")}>
                  Invite admin
                </Button>
              </div>
              <DataTable columns={["Administrator", "Role", "Status"]}>
                <tr>
                  <td>
                    <strong>{adminProfile.name}</strong>
                    <br />
                    {adminProfile.email}
                  </td>
                  <td>{translate("Super Administrator", language)}</td>
                  <td>
                    <StatusBadge status="Active" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Ko Zaw Min</strong>
                    <br />
                    zawmin@moe.edu.mm
                  </td>
                  <td>{translate("Membership Manager", language)}</td>
                  <td>
                    <StatusBadge status="Active" />
                  </td>
                </tr>
              </DataTable>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
