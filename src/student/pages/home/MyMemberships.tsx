import { ChevronRight } from "lucide-react"
import { Link } from "react-router"
import { EmptyState, StatusBadge } from "../../../components/shared/UI"
import { useAppState } from "../../../state/AppState"
import { activeStudent } from "../../data/studentProfile"
import { BrandLogo } from "../../../components/shared/BrandLogo"

export function MyMemberships() {
  const { memberships } = useAppState()
  const mine = memberships.filter((m) => m.studentId === activeStudent.id)
  return (
    <div>
      <div className="mini-greeting">
        <div>
          <span>Good morning</span>
          <h1>Hi, Thiri</h1>
          <p>{activeStudent.id}</p>
        </div>
        <div className="mini-avatar">TA</div>
      </div>
      <div className="mini-stats">
        <div>
          <strong>{mine.length}</strong>
          <span>Total memberships</span>
        </div>
        <div>
          <strong>{mine.filter((m) => m.status === "Active").length}</strong>
          <span>Active now</span>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>My memberships</h2>
          <p>Your current and upcoming access</p>
        </div>
      </div>
      {mine.length ? (
        <div className="membership-cards">
          {mine.map((membership, index) => (
            <Link
              to={`/app/memberships/${membership.id}`}
              key={membership.id}
              className={`membership-tile ${
                index === 0 ? "membership-tile--primary" : ""
              }`}
            >
              <div className="tile-top">
                <BrandLogo className="tile-logo-image" />
                <StatusBadge status={membership.status} />
              </div>
              <span>MEMBERSHIP PROGRAM</span>
              <h2>{membership.program}</h2>
              <p>{membership.id}</p>
              <div className="tile-dates">
                <div>
                  <span>Start date</span>
                  <strong>{membership.start}</strong>
                </div>
                <div>
                  <span>Expiry date</span>
                  <strong>{membership.expiry}</strong>
                </div>
              </div>
              <div className="tile-action">
                View details <ChevronRight size={17} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No memberships yet"
          description="Your active memberships will appear here after you join."
        />
      )}
    </div>
  )
}
