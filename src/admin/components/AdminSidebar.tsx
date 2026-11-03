import {
  BookOpenCheck,
  ChevronsUpDown,
  ClipboardList,
  ExternalLink,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  Send,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { BrandLogo } from "../../components/shared/BrandLogo"
import { NavLink } from "react-router"
import { translate } from "../../i18n"
import { getAdminInitials, useAppState } from "../../state/AppState"

type NavItem = {
  to: string

  label: string

  icon: LucideIcon

  end?: boolean

  count?: "students" | "invitations"
}

const navigation: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",

    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },

  {
    group: "People",

    items: [
      {
        to: "/admin/students",
        label: "Students",
        icon: Users,
        count: "students",
      },

      { to: "/admin/memberships", label: "Memberships", icon: BookOpenCheck },

      {
        to: "/admin/invitations",

        label: "Invitations",

        icon: Send,

        count: "invitations",
      },
    ],
  },

  {
    group: "Catalog",

    items: [
      {
        to: "/admin/programs",

        label: "Membership Programs",

        icon: GraduationCap,
      },
    ],
  },

  {
    group: "Insights",

    items: [
      { to: "/admin/reports", label: "Reports", icon: FileBarChart },

      { to: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
    ],
  },

  {
    group: "System",

    items: [{ to: "/admin/settings", label: "Admin Settings", icon: Settings }],
  },
]

type AdminSidebarProps = {
  isOpen: boolean

  counts: { students: number; invitations: number }

  onClose: () => void
}

function AdminSidebarFooter() {
  const { adminProfile, language } = useAppState()
  return (
    <div className="rail-foot">
      <a className="rail-preview" href="/app/invitation">
        <span className="rail-preview-dot" />
        {translate("Student app preview", language)}
        <ExternalLink size={13} />
      </a>
      <div className="rail-user">
        <div className="rail-avatar">{getAdminInitials(adminProfile.name)}</div>
        <div>
          <strong>{adminProfile.name}</strong>
          <span>{translate("Super Administrator", language)}</span>
        </div>
        <ChevronsUpDown size={14} />
      </div>
    </div>
  )
}

export function AdminSidebar({ isOpen, counts, onClose }: AdminSidebarProps) {
  const { language } = useAppState()
  return (
    <aside className={`rail ${isOpen ? "rail--open" : ""}`}>
      <div className="rail-brand">
        <BrandLogo className="rail-mark-image" />
        {/* <div className="rail-brand-copy">
          <b>MOE</b>
          <span>Membership</span>
        </div> */}
        <ChevronsUpDown size={14} className="rail-brand-switch" />
        <button
          className="rail-close"
          onClick={onClose}
          aria-label={translate("Close menu", language)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="rail-nav" aria-label="Primary">
        {navigation.map(({ group, items }) => (
          <div className="rail-group" key={group}>
            <div className="rail-group-label">{translate(group, language)}</div>
            {items.map(({ to, label, icon: Icon, end, count }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `rail-link ${isActive ? "is-active" : ""}`
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{translate(label, language)}</span>
                {count && counts[count] > 0 && (
                  <em className="rail-count">{counts[count]}</em>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <AdminSidebarFooter />
    </aside>
  )
}
