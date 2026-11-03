import {
  Check,
  Copy,
  Download,
  Link2,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
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
import { BrandLogo } from "../../../components/shared/BrandLogo"
import { dateKey } from "../../../utils/date"

export function Invitations() {
  const {
    invitations,
    students,
    programs,
    addInvitation,
    updateInvitation,
    language,
  } = useAppState()
  const [query, setQuery] = useState("")
  const [program, setProgram] = useState("All")
  const [status, setStatus] = useState("All")
  const [createdDate, setCreatedDate] = useState("")
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const navigate = useNavigate()
  const filtered = invitations.filter(
    (i) =>
      `${i.id} ${i.student} ${i.phone} ${i.program}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (program === "All" || i.program === program) &&
      (status === "All" || i.status === status) &&
      (!createdDate || dateKey(i.created) === createdDate),
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const selected = students.find((s) => s.id === data.get("studentId"))
    const name =
      mode === "existing" ? selected?.name || "" : String(data.get("name"))
    const phone =
      mode === "existing" ? selected?.phone || "" : String(data.get("phone"))
    const invite = addInvitation({
      studentId: selected?.id || "NEW",
      student: name,
      phone,
      program: String(data.get("program")),
      start: String(data.get("start")),
      expiry: String(data.get("expiry")),
    })
    setOpen(false)
    navigate(`/admin/invitations/${invite.id}`)
  }
  return (
    <>
      <PageTitle
        title="Invitations"
        description="Create, share, and monitor personal Telegram invitations."
        actions={
          <Button icon={<Plus size={17} />} onClick={() => setOpen(true)}>
            Create invitation
          </Button>
        }
      />
      <Card>
        <div className="filters filters--wrap">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search student or phone"
          />
          <Select value={program} onChange={(e) => setProgram(e.target.value)}>
            <option>All</option>
            {programs.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Pending</option>
            <option>Redeemed</option>
            <option>Expired</option>
            <option>Revoked</option>
          </Select>
          <Field
            label=""
            type="date"
            aria-label="Created date"
            value={createdDate}
            onChange={(event) => setCreatedDate(event.target.value)}
          />
        </div>
        <DataTable
          columns={[
            "Student",
            "Program",
            "Membership dates",
            "Status",
            "Created",
            "Actions",
          ]}
        >
          {filtered.map((invite) => (
            <tr key={invite.id}>
              <td>
                <div className="person-copy">
                  <strong>{invite.student}</strong>
                  <span>{invite.phone}</span>
                </div>
              </td>
              <td>{translate(invite.program, language)}</td>
              <td>
                <div className="person-copy">
                  <strong>{invite.start}</strong>
                  <span>
                    {translate("to", language)} {invite.expiry}
                  </span>
                </div>
              </td>
              <td>
                <StatusBadge status={invite.status} />
              </td>
              <td>{invite.created}</td>
              <td>
                <div className="row-actions">
                  <Link to={`/admin/invitations/${invite.id}`}>View</Link>
                  {invite.status === "Pending" && (
                    <Button
                      variant="ghost"
                      onClick={() => setRevokeId(invite.id)}
                    >
                      Revoke
                    </Button>
                  )}
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
        title="Create invitation"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invitation-form">
              Create invitation
            </Button>
          </>
        }
      >
        <form id="invitation-form" onSubmit={submit}>
          <div className="choice-cards">
            <button
              type="button"
              className={mode === "existing" ? "active" : ""}
              onClick={() => setMode("existing")}
            >
              <Check size={18} />
              Select existing student
            </button>
            <button
              type="button"
              className={mode === "new" ? "active" : ""}
              onClick={() => setMode("new")}
            >
              <Plus size={18} />
              Create new student
            </button>
          </div>
          {mode === "existing" ? (
            <Select label="Student" name="studentId" required>
              <option value="">Select a student</option>
              {students.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name} — {s.phone}
                </option>
              ))}
            </Select>
          ) : (
            <div className="form-grid">
              <Field label="Student name" name="name" required />
              <Field label="Phone number" name="phone" required />
            </div>
          )}
          <Select label="Membership program" name="program" required>
            <option value="">Select program</option>
            {programs
              .filter((p) => p.status === "Active")
              .map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
          </Select>
          <div className="form-grid">
            <Field
              label="Membership start date"
              name="start"
              type="date"
              required
            />
            <Field
              label="Membership expiry date"
              name="expiry"
              type="date"
              required
            />
          </div>
          <div className="info-banner">
            <ShieldAlert size={18} />
            <span>
              {translate(
                "Overlapping memberships for the same student and program are not allowed.",
                language,
              )}
            </span>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        title="Revoke invitation?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRevokeId(null)}>
              Keep invitation
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (revokeId) updateInvitation(revokeId, "Revoked")
                setRevokeId(null)
              }}
            >
              Revoke invitation
            </Button>
          </>
        }
      >
        <p>
          This invitation link will stop working immediately. This action does
          not affect an already active membership.
        </p>
      </Modal>
    </>
  )
}

export function InvitationPreview() {
  const { id } = useParams()
  const { invitations, updateInvitation, notify, language } = useAppState()
  const invitation =
    invitations.find((item) => item.id === id) || invitations[0]
  const [confirm, setConfirm] = useState<"revoke" | "reissue" | null>(null)
  const link = `https://t.me/MOEMembershipBot/app?startapp=${invitation.id.toLowerCase()}`
  const message =
    language === "MY"
      ? `မင်္ဂလာပါ ${invitation.student},\n\nMOE အသင်းဝင်ရန် သင့်ကိုယ်ပိုင်ဖိတ်ကြားချက် အသင့်ဖြစ်ပါပြီ။\n\nအသင်းဝင်မှုစတင်ရန် အောက်ပါလင့်ခ်ကို Telegram ဖြင့်ဖွင့်ပြီး အတည်ပြု၍ ဝင်ရောက်ရန်ကို နှိပ်ပါ။\n\n${link}\n\nကိုယ်ပိုင်ဖိတ်ကြားချက်ဖြစ်ပါသည် — အခြားသူများနှင့် မမျှဝေပါနှင့်။\n\nကျေးဇူးတင်ပါသည်၊\nMOE`
      : `Hello ${invitation.student},\n\nYour personal invitation to join MOE Membership is ready.\n\nPlease open the link below using Telegram and tap Confirm & Join to activate your membership.\n\n${link}\n\nPersonal invitation — please do not share.\n\nThank you,\nMOE`
  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    notify(label)
  }
  return (
    <>
      <PageTitle
        title="Invitation preview"
        description={`${invitation.id} · ${translate("Created", language)} ${invitation.created}`}
        actions={<StatusBadge status={invitation.status} />}
      />
      <div className="preview-grid">
        <Card>
          <div className="invitation-hero">
            <div className="invite-icon">
              <Send size={24} />
            </div>
            <div>
              <span>
                {translate("Personal membership invitation", language)}
              </span>
              <h2>{invitation.student}</h2>
              <p>{translate(invitation.program, language)}</p>
            </div>
          </div>
          <div className="details details--two">
            <DetailRow label="Phone number" value={invitation.phone} />
            <DetailRow
              label="Invitation validity"
              value={`7 ${translate("days", language)}`}
            />
            <DetailRow label="Membership starts" value={invitation.start} />
            <DetailRow label="Membership expires" value={invitation.expiry} />
            <DetailRow label="Created" value={invitation.created} />
            <DetailRow
              label="Invitation status"
              value={<StatusBadge status={invitation.status} />}
            />
          </div>
          <div className="warning">
            <ShieldAlert size={20} />
            <div>
              <strong>
                {translate("Membership is not active yet", language)}
              </strong>
              <span>
                {translate(
                  "Creating an invitation does not activate the membership. It becomes active only after the student confirms and joins through Telegram.",
                  language,
                )}
              </span>
            </div>
          </div>
        </Card>
        <Card className="share-card">
          <div className="qr-code" aria-label="QR code representation">
            <div className="qr-inner"><BrandLogo className="qr-inner-logo" /></div>
          </div>
          <h2>{translate("Telegram invitation link", language)}</h2>
          <p>
            {translate("Share only with", language)} {invitation.student}.
          </p>
          <div className="link-box">
            <Link2 size={17} />
            <span>{link}</span>
          </div>
          <div className="share-actions">
            <Button
              icon={<Copy size={16} />}
              onClick={() => copy(link, "Invitation link copied")}
            >
              Copy link
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => notify("QR code download prepared")}
            >
              Download QR
            </Button>
          </div>
        </Card>
      </div>
      <Card>
        <div className="card-heading">
          <div>
            <h2>{translate("Messenger message", language)}</h2>
            <p>{translate("Ready-to-copy invitation message", language)}</p>
          </div>
          <Button
            variant="secondary"
            icon={<Copy size={16} />}
            onClick={() => copy(message, "Messenger message copied")}
          >
            Copy message
          </Button>
        </div>
        <pre className="message-template">{message}</pre>
      </Card>
      <div className="danger-zone">
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={() => setConfirm("reissue")}
        >
          Reissue invitation
        </Button>
        <Button variant="danger" onClick={() => setConfirm("revoke")}>
          Revoke invitation
        </Button>
      </div>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm === "reissue" ? "Reissue invitation?" : "Revoke invitation?"
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm === "revoke" ? "danger" : "primary"}
              onClick={() => {
                updateInvitation(
                  invitation.id,
                  confirm === "revoke" ? "Revoked" : "Pending",
                )
                setConfirm(null)
              }}
            >
              {confirm === "reissue" ? "Reissue now" : "Revoke"}
            </Button>
          </>
        }
      >
        <p>
          {translate(
            confirm === "reissue"
              ? "The previous personal link will be invalidated and replaced with a new invitation."
              : "The student will no longer be able to use this invitation link.",
            language,
          )}
        </p>
      </Modal>
    </>
  )
}
