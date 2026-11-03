import { LoaderCircle, LockKeyhole } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { BrandLogo } from "../../../components/shared/BrandLogo"
import { Button } from "../../../components/shared/UI"

export function ActivationLoading() {
  const navigate = useNavigate()
  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/app/success"), 1800)
    return () => window.clearTimeout(timer)
  }, [navigate])
  return (
    <div className="state-screen">
      <div className="mini-brand mini-brand--center">
        <BrandLogo className="brand-logo--standalone" />
        {/* <div>
          <b>MOE</b>
          <span>Membership</span>
        </div> */}
      </div>
      <div className="loading-orbit">
        <LoaderCircle className="spin" size={48} />
        <div>
          <LockKeyhole size={20} />
        </div>
      </div>
      <h1>Activating Your Membership...</h1>
      <p>Please wait while we confirm your membership.</p>
      <Button className="button--wide button--large" disabled>
        Processing securely
      </Button>
      <span className="state-helper">Please don’t close this window</span>
    </div>
  )
}
