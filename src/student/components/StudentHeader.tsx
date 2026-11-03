import { CircleHelp } from "lucide-react"
import { BrandLogo } from "../../components/shared/BrandLogo"

export function StudentHeader() {
  return (
    <header className="mini-top">
      <div className="mini-brand">
        <BrandLogo className="brand-logo--student" />
        {/* <div>
          <b>MOE</b>
          <span>Membership</span>
        </div> */}
      </div>
      <CircleHelp size={21} />
    </header>
  )
}
