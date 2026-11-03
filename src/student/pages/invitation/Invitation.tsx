import {
  CalendarDays,
  Check,
  ContactRound,
  CreditCard,
  ShieldCheck,
} from "lucide-react"
import { useNavigate } from "react-router"
import { BrandLogo } from "../../../components/shared/BrandLogo"
import { Button } from "../../../components/shared/UI"

export function Invitation() {
  const navigate = useNavigate()
  return (
    <div className="invite-screen">
      <div className="mini-brand mini-brand--center">
        <BrandLogo className="brand-logo--standalone" />
        {/* <div>
          <b>MOE</b>
          <span>Membership</span>
        </div> */}
      </div>
      <div className="welcome">
        <span>PERSONAL INVITATION</span>
        <h1>Welcome, Su Myat Noe</h1>
        <p>
          Your membership invitation is ready. Please review your information
          before joining.
        </p>
      </div>
      <div className="invite-program">
        <div className="program-symbol">
          <CreditCard size={24} />
        </div>
        <span>Membership program</span>
        <h2>MOE Premium Learning</h2>
        <p>
          Premium access to learning resources, mentorship, and member support.
        </p>
      </div>
      <div className="date-pair">
        <div>
          <CalendarDays size={18} />
          <span>Starts</span>
          <strong>01 Feb 2025</strong>
        </div>
        <div>
          <CalendarDays size={18} />
          <span>Expires</span>
          <strong>31 Jan 2026</strong>
        </div>
      </div>
      <div className="mini-benefits">
        <strong>Your benefits</strong>
        {[
          "Full learning resource library",
          "Monthly group mentoring",
          "Priority member support",
        ].map((item) => (
          <div key={item}>
            <Check size={16} />
            {item}
          </div>
        ))}
      </div>
      <div className="privacy-note">
        <ShieldCheck size={19} />
        <span>
          This personal invitation is linked to your Telegram account. Please do
          not share it.
        </span>
      </div>
      <Button
        className="button--wide button--large"
        onClick={() => navigate("/app/activation")}
      >
        Confirm & Join
      </Button>
      <a
        className="contact-link"
        href="https://t.me/"
        target="_blank"
        rel="noreferrer"
      >
        <ContactRound size={17} />
        Contact MOE Page
      </a>
    </div>
  )
}
