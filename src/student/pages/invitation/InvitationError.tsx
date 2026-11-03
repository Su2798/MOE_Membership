import {
  AlertTriangle,
  CalendarDays,
  CircleX,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useSearchParams } from "react-router"
import { BrandLogo } from "../../../components/shared/BrandLogo"
import { Button } from "../../../components/shared/UI"

export function InvitationError() {
  const [params] = useSearchParams()
  const type = params.get("type") || "invalid"
  const error = errors[type] || errors.invalid
  const Icon = error.icon
  return (
    <div className="state-screen error-screen">
      <div className="mini-brand mini-brand--center">
        <BrandLogo className="brand-logo--standalone" />
        <span className="brand-caption">Membership portal</span>
      </div>
      <section className="error-content">
        <div className="error-mark">
          <Icon size={36} strokeWidth={1.8} />
        </div>
        <span className="eyebrow">WE COULDN’T CONTINUE</span>
        <h1>{error.title}</h1>
        <p>{error.description}</p>
        {error.action &&
          (type === "network" ? (
            <Button
              className="button--wide button--large"
              onClick={() => window.location.reload()}
              icon={<RefreshCw size={18} />}
            >
              {error.action}
            </Button>
          ) : (
            <a
              className="button button--primary button--wide button--large"
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
            >
              <Send size={18} />
              {error.action}
            </a>
          ))}
        <span className="state-helper">
          Reference: MOE-{type.toUpperCase()}-2048
        </span>
      </section>
    </div>
  )
}

const errors: Record<string, {
  title: string
  description: string
  icon: typeof AlertTriangle
  action?: string
}> = {
  expired: {
    title: "Invitation Expired",
    description:
      "This invitation was valid for 7 days and can no longer be used. Please ask MOE for a new invitation.",
    icon: CalendarDays,
    action: "Contact MOE Page",
  },
  revoked: {
    title: "Invitation Revoked",
    description:
      "This invitation has been cancelled by an MOE administrator. No membership was activated.",
    icon: CircleX,
    action: "Contact MOE Page",
  },
  used: {
    title: "Invitation Already Used",
    description:
      "This personal invitation was already redeemed by a different Telegram account.",
    icon: UserRound,
    action: "Contact MOE Page",
  },
  mismatch: {
    title: "Telegram Account Mismatch",
    description:
      "This invitation belongs to another Telegram account. Please open it using the account it was sent to.",
    icon: ShieldCheck,
  },
  disabled: {
    title: "Account Disabled",
    description:
      "Your student account is currently disabled, so membership access is unavailable.",
    icon: LockKeyhole,
    action: "Contact MOE Page",
  },
  network: {
    title: "Connection Problem",
    description:
      "We could not reach MOE right now. Check your connection and try again.",
    icon: RefreshCw,
    action: "Try Again",
  },
  invalid: {
    title: "Invalid Invitation Link",
    description:
      "This link is incomplete or not recognized. Please use the original personal link sent by MOE.",
    icon: AlertTriangle,
    action: "Contact MOE Page",
  },
}
