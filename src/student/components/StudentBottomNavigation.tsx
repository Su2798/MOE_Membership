import { ContactRound, CreditCard, UserRound } from "lucide-react"

import { NavLink } from "react-router"

export function StudentBottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Student navigation">
      <NavLink to="/app/memberships">
        <CreditCard size={20} />
        <span>Memberships</span>
      </NavLink>
      <NavLink to="/app/profile">
        <UserRound size={20} />
        <span>Profile</span>
      </NavLink>
      <a href="https://t.me/" target="_blank" rel="noreferrer">
        <ContactRound size={20} />
        <span>Contact MOE</span>
      </a>
    </nav>
  )
}
