import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react"
import { Link } from "react-router"
import { StatusBadge } from "../../../components/shared/UI"
import { translate } from "../../../i18n"
import { useAppState } from "../../../state/AppState"

function relativeCreated(created: string) {
  if (created === "24 Jan 2025") return "2 mins ago"
  if (created === "19 Jan 2025") return "4 hours ago"
  if (created === "06 Jan 2025") return "Yesterday"
  return "2 days ago"
}

export function Dashboard() {
  const { students, invitations, language } = useAppState()
  const totalStudents = students.length + 1243
  const pendingInvitations =
    invitations.filter((invitation) => invitation.status === "Pending").length +
    22
  const recentInvitations = invitations.slice(0, 4)

  return (
    <div className="db-ref">
      <header className="db-ref-welcome">
        <div>
          <span className="db-ref-eyebrow">
            {translate("Good morning, Admin", language)}
          </span>
          <h1>{translate("Ready to invite new students?", language)}</h1>
          <p>
            {translate(
              "Manage your premium memberships, track pending invitations, and monitor student engagement from your command center.",
              language,
            )}
          </p>
        </div>
        <Link className="db-ref-primary" to="/admin/invitations">
          <Plus size={16} />
          {translate("Generate personal invitation", language)}
        </Link>
      </header>

      <section
        className="db-ref-stats"
        aria-label={translate("Membership summary", language)}
      >
        <Link to="/admin/students" className="db-ref-stat">
          <span>{translate("Total students", language)}</span>
          <strong>{totalStudents.toLocaleString()}</strong>
        </Link>
        <Link to="/admin/invitations" className="db-ref-stat db-ref-stat--orange">
          <span>{translate("Pending invites", language)}</span>
          <strong>{pendingInvitations}</strong>
        </Link>
        <Link to="/admin/reports" className="db-ref-stat db-ref-stat--health">
          <span>{translate("Health index", language)}</span>
          <strong>94% <small>{translate("Healthy", language)}</small></strong>
        </Link>
        <Link to="/admin/memberships" className="db-ref-stat">
          <span>{translate("Renewals needed", language)}</span>
          <strong>12 <small className="db-ref-action">{translate("Action", language)}</small></strong>
        </Link>
      </section>

      <section className="db-ref-overview">
        <article className="db-ref-invitations">
          <div className="db-ref-section-heading">
            <div>
              <h2>{translate("Recent invitations", language)}</h2>
              <p>{translate("Track status of generated links and QR codes.", language)}</p>
            </div>
            <Link to="/admin/invitations">
              {translate("View all", language)} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="db-ref-table-scroll">
            <table className="db-ref-table">
              <thead>
                <tr>
                  <th>{translate("Student & program", language)}</th>
                  <th>{translate("Created", language)}</th>
                  <th>{translate("Status", language)}</th>
                </tr>
              </thead>
              <tbody>
                {recentInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>
                      <Link
                        to={`/admin/invitations/${invitation.id}`}
                        className="db-ref-person"
                      >
                        <strong>{invitation.student}</strong>
                        <span>{translate(invitation.program, language)}</span>
                      </Link>
                    </td>
                    <td>{relativeCreated(invitation.created)}</td>
                    <td>
                      <StatusBadge status={invitation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="db-ref-attention">
          <div className="db-ref-attention-heading">
            <span><BellRing size={14} /></span>
            <div>
              <h2>{translate("Requires attention", language)}</h2>
              <p>{translate("Memberships expiring soon.", language)}</p>
            </div>
            <strong>12</strong>
          </div>
          <div className="db-ref-renewals">
            {[
              { name: "Hnin Wai Phyo", id: "MEM-82938", remaining: "7 days" },
              { name: "Aye Chan Mon", id: "MEM-82921", remaining: "12 days" },
            ].map((member) => (
              <Link
                to="/admin/memberships"
                className="db-ref-renewal"
                key={member.id}
              >
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.id}</small>
                </span>
                <em>
                  {member.remaining.replace("days", translate("days", language))}
                </em>
                <span className="db-ref-renew-action">
                {translate("Review renewal", language)} <ChevronRight size={13} />
                </span>
              </Link>
            ))}
          </div>
          <Link className="db-ref-attention-link" to="/admin/memberships">
            {translate("Review all renewals", language)} <ArrowRight size={14} />
          </Link>
        </aside>
      </section>

      <div className="db-ref-footer-note">
        <CheckCircle2 size={13} />
        {translate("Membership data is up to date", language)}
        <span><Clock3 size={12} /> {translate("Updated just now", language)}</span>
        <Link to="/admin/reports"><ShieldCheck size={13} /> {translate("View report", language)}</Link>
        <Link to="/admin/invitations"><Send size={13} /> {translate("Invitations", language)}</Link>
      </div>
    </div>
  )
}
