import { CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router"
import { BrandLogo } from "../../../components/shared/BrandLogo"
import { Button } from "../../../components/shared/UI"

export function ActivationSuccess() {
  const navigate = useNavigate()
  return (
    <div className="state-screen success-screen">
      <div className="mini-brand mini-brand--center">
        <BrandLogo className="brand-logo--standalone" />
        {/* <div>
          <b>MOE</b>
          <span>Membership</span>
        </div> */}
      </div>
      <div className="success-mark">
        <CheckCircle2 size={48} />
      </div>
      <span className="eyebrow success-text">ACTIVATION COMPLETE</span>
      <h1>Membership Activated Successfully!</h1>
      <p>Welcome to the MOE member community, Su Myat Noe.</p>
      <div className="success-summary">
        <div>
          <span>Student</span>
          <strong>Su Myat Noe</strong>
        </div>
        <div>
          <span>Program</span>
          <strong>MOE Premium Learning</strong>
        </div>
        <div>
          <span>Membership ID</span>
          <strong>MEM-82942</strong>
        </div>
        <div>
          <span>Valid period</span>
          <strong>01 Feb 2025 – 31 Jan 2026</strong>
        </div>
      </div>
      <Button
        className="button--wide button--large"
        onClick={() => navigate("/app/memberships/MEM-82941")}
      >
        View Membership
      </Button>
      <Button
        variant="secondary"
        className="button--wide button--large"
        onClick={() => navigate("/app/memberships")}
      >
        My Memberships
      </Button>
    </div>
  )
}
