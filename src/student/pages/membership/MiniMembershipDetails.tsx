import { ArrowLeft, Check, LockKeyhole } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { StatusBadge } from "../../../components/shared/UI"
import { useAppState } from "../../../state/AppState"
import { BrandLogo } from "../../../components/shared/BrandLogo"

export function MiniMembershipDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { memberships, programs } = useAppState()
  const membership = memberships.find((m) => m.id === id) || memberships[0]
  const program =
    programs.find((p) => p.name === membership.program) || programs[0]
  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Membership details
      </button>
      <div className="digital-card">
        <div className="digital-card-top">
          <BrandLogo className="tile-logo-image" />
          <span>MEMBER CARD</span>
        </div>
        <div className="digital-name">
          <span>MEMBER</span>
          <h2>{membership.student}</h2>
          <p>{membership.program}</p>
        </div>
        <div className="digital-card-bottom">
          <div>
            <span>STUDENT ID</span>
            <strong>{membership.studentId}</strong>
          </div>
          <div>
            <span>MEMBERSHIP ID</span>
            <strong>{membership.id}</strong>
          </div>
          <StatusBadge status={membership.status} />
        </div>
      </div>
      <div className="read-only">
        <LockKeyhole size={15} />
        Membership information is read-only
      </div>
      <section className="mini-section">
        <h2>Membership period</h2>
        <div className="date-pair date-pair--plain">
          <div>
            <span>Start date</span>
            <strong>{membership.start}</strong>
          </div>
          <div>
            <span>Expiry date</span>
            <strong>{membership.expiry}</strong>
          </div>
        </div>
      </section>
      <section className="mini-section">
        <h2>About this program</h2>
        <p>{program.description}</p>
      </section>
      <section className="mini-section">
        <h2>Membership benefits</h2>
        <div className="mini-benefits mini-benefits--plain">
          {program.benefits.split(", ").map((item) => (
            <div key={item}>
              <Check size={16} />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
