import {
  MoreHorizontal,
  Pencil,
  Plus,
  UserRound,
  UserRoundCheck,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
  Button,
  Card,
  DataTable,
  DetailRow,
  Field,
  Modal,
  PageTitle,
  Pagination,
  SearchBar,
  Select,
  StatusBadge,
} from "../../../components/shared/UI"
import { translate } from "../../../i18n"
import { useAppState } from "../../../state/AppState"

export function Students() {
  const { students, addStudent } = useAppState()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All")
  const [telegram, setTelegram] = useState("All")
  const [open, setOpen] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const filtered = students.filter(
    (s) =>
      `${s.name} ${s.phone} ${s.id}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All" || s.status === status) &&
      (telegram === "All" || String(s.telegram) === telegram),
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const phone = String(data.get("phone"))
    if (students.some((student) => student.phone === phone)) {
      setDuplicate(true)
      return
    }
    addStudent({
      name: String(data.get("name")),
      phone,
      language: String(data.get("language")) as "English" | "မြန်မာ",
      status: String(data.get("status")) as "Active" | "Disabled",
    })
    setDuplicate(false)
    setOpen(false)
  }

  return (
    <>
      <PageTitle
        title="Students"
        description="Manage student records, account access, and Telegram connections."
        actions={
          <Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>
            Add student
          </Button>
        }
      />
      <Card>
        <div className="filters">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search name, phone, or student ID"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Disabled</option>
          </Select>
          <Select
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          >
            <option value="All">All Telegram statuses</option>
            <option value="true">Connected</option>
            <option value="false">Not connected</option>
          </Select>
        </div>
        <DataTable
          columns={[
            "Student ID",
            "Student name",
            "Phone number",
            "Telegram",
            "Memberships",
            "Account status",
            "Created",
            "Actions",
          ]}
        >
          {filtered.map((student) => (
            <tr key={student.id}>
              <td>
                <Link
                  to={`/admin/students/${student.id}`}
                  className="table-link"
                >
                  {student.id}
                </Link>
              </td>
              <td>
                <div className="person">
                  <div className="avatar avatar--soft">
                    {student.name
                      .split(" ")
                      .map((v) => v[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <strong>{student.name}</strong>
                </div>
              </td>
              <td>{student.phone}</td>
              <td>
                <span className={student.telegram ? "connected" : "muted"}>
                  {student.telegram ? (
                    <UserRoundCheck size={16} />
                  ) : (
                    <UserRound size={16} />
                  )}
                  {student.telegram ? "Connected" : "Not connected"}
                </span>
              </td>
              <td>{student.membershipCount}</td>
              <td>
                <StatusBadge status={student.status} />
              </td>
              <td>{student.created}</td>
              <td>
                <div className="row-actions">
                  <Link to={`/admin/students/${student.id}`}>View</Link>
                  <Button
                    variant="ghost"
                    icon={<MoreHorizontal size={18} />}
                    aria-label="More actions"
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        <Pagination />
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add new student"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="student-form">
              Save student
            </Button>
          </>
        }
      >
        <form id="student-form" onSubmit={submit} className="form-grid">
          <Field
            label="Full name"
            name="name"
            required
            placeholder="Enter student's full name"
          />
          <Field
            label="Phone number"
            name="phone"
            required
            placeholder="+95 9..."
            error={
              duplicate
                ? "This phone number is already in use. Create a separate record only if intentional; records are never merged automatically."
                : undefined
            }
          />
          <Select label="Preferred language" name="language">
            <option>English</option>
            <option>မြန်မာ</option>
          </Select>
          <Select label="Account status" name="status">
            <option>Active</option>
            <option>Disabled</option>
          </Select>
        </form>
      </Modal>
    </>
  )
}

export function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    students,
    memberships,
    invitations,
    updateStudent,
    language,
  } = useAppState()
  const student = students.find((item) => item.id === id) || students[0]
  const [edit, setEdit] = useState(false)
  const relatedMemberships = memberships.filter(
    (item) => item.studentId === student.id,
  )
  const relatedInvites = invitations.filter(
    (item) => item.studentId === student.id,
  )
  return (
    <>
      <PageTitle
        title={student.name}
        description={`${student.id} · ${translate("Student profile", language)}`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Pencil size={16} />}
              onClick={() => setEdit(true)}
            >
              Edit student
            </Button>
            <Button
              variant={student.status === "Active" ? "danger" : "primary"}
              onClick={() =>
                updateStudent(student.id, {
                  status: student.status === "Active" ? "Disabled" : "Active",
                })
              }
            >
              {student.status === "Active"
                ? "Disable account"
                : "Enable account"}
            </Button>
          </>
        }
      />
      <div className="detail-grid">
        <Card>
          <div className="profile-summary">
            <div className="profile-avatar">
              {student.name
                .split(" ")
                .map((v) => v[0])
                .slice(0, 2)
                .join("")}
            </div>
            <h2>{student.name}</h2>
            <StatusBadge status={student.status} />
          </div>
          <div className="details">
            <DetailRow label="Student ID" value={student.id} />
            <DetailRow label="Phone number" value={student.phone} />
            <DetailRow
              label="Telegram"
              value={
                student.telegram
                  ? `${translate("Connected", language)} · 628394105`
                  : translate("Not connected", language)
              }
            />
            <DetailRow
              label="Preferred language"
              value={translate(student.language, language)}
            />
            <DetailRow label="Created date" value={student.created} />
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <h2>{translate("Memberships", language)}</h2>
              <p>
                {relatedMemberships.length}{" "}
                {translate("memberships attached", language)}
              </p>
            </div>
          </div>
          {relatedMemberships.length ? (
            relatedMemberships.map((m) => (
              <Link
                className="record-row"
                to={`/admin/memberships/${m.id}`}
                key={m.id}
              >
                <div>
                  <strong>{translate(m.program, language)}</strong>
                  <span>
                    {m.id} · {m.start} – {m.expiry}
                  </span>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))
          ) : (
            <p className="muted">{translate("No memberships yet.", language)}</p>
          )}
        </Card>
      </div>
      <Card>
        <div className="tabs">
          <button className="active">
            {translate("Invitation history", language)}
          </button>
          <button>{translate("Membership history", language)}</button>
        </div>
        <DataTable columns={["Invitation ID", "Program", "Created", "Status"]}>
          {relatedInvites.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{translate(inv.program, language)}</td>
              <td>{inv.created}</td>
              <td>
                <StatusBadge status={inv.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title="Edit student"
        actions={
          <>
            <Button variant="secondary" onClick={() => setEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-student">
              Save changes
            </Button>
          </>
        }
      >
        <form
          id="edit-student"
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            updateStudent(student.id, {
              name: String(data.get("name")),
              phone: String(data.get("phone")),
              language: String(data.get("language")) as "English" | "မြန်မာ",
            })
            setEdit(false)
          }}
        >
          <Field label="Full name" name="name" defaultValue={student.name} />
          <Field
            label="Phone number"
            name="phone"
            defaultValue={student.phone}
          />
          <Select
            label="Preferred language"
            name="language"
            defaultValue={student.language}
          >
            <option>English</option>
            <option>မြန်မာ</option>
          </Select>
        </form>
      </Modal>
      <Button variant="ghost" onClick={() => navigate("/admin/students")}>
        ← {translate("Back to students", language)}
      </Button>
    </>
  )
}
