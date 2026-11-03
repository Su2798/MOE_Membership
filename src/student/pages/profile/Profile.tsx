import {
  Check,
  CheckCircle2,
  ChevronRight,
  ContactRound,
  Globe2,
  LockKeyhole,
} from "lucide-react"
import { useState } from "react"
import { DetailRow, StatusBadge } from "../../../components/shared/UI"
import { useAppState } from "../../../state/AppState"
import { activeStudent } from "../../data/studentProfile"

export function Profile() {
  const { notify } = useAppState()
  const [language, setLanguage] = useState<"English" | "မြန်မာ">("English")
  return (
    <div>
      <div className="profile-mobile">
        <div className="profile-mobile-avatar">TA</div>
        <h1>{activeStudent.name}</h1>
        <p>{activeStudent.id}</p>
        <StatusBadge status="Active" />
      </div>
      <section className="mini-section profile-details">
        <h2>Personal information</h2>
        <DetailRow label="Student name" value={activeStudent.name} />
        <DetailRow label="Student ID" value={activeStudent.id} />
        <DetailRow label="Phone number" value={activeStudent.phone} />
        <DetailRow
          label="Telegram account"
          value={
            <span className="connected">
              <CheckCircle2 size={15} /> Connected
            </span>
          }
        />
      </section>
      <section className="mini-section">
        <h2>Preferred language</h2>
        <p>Choose the language used throughout your app.</p>
        <div className="mini-language">
          <button
            className={language === "English" ? "active" : ""}
            onClick={() => {
              setLanguage("English")
              notify("Language changed to English")
            }}
          >
            <Globe2 size={18} />
            <span>
              <strong>English</strong>
              <small>English</small>
            </span>
            {language === "English" && <Check size={18} />}
          </button>
          <button
            className={language === "မြန်မာ" ? "active" : ""}
            onClick={() => {
              setLanguage("မြန်မာ")
              notify("ဘာသာစကား ပြောင်းပြီးပါပြီ")
            }}
          >
            <Globe2 size={18} />
            <span>
              <strong>မြန်မာ</strong>
              <small>Myanmar</small>
            </span>
            {language === "မြန်မာ" && <Check size={18} />}
          </button>
        </div>
      </section>
      <a
        className="contact-card"
        href="https://t.me/"
        target="_blank"
        rel="noreferrer"
      >
        <div>
          <ContactRound size={20} />
        </div>
        <span>
          <strong>Need help?</strong>
          <small>Contact the MOE Page</small>
        </span>
        <ChevronRight size={18} />
      </a>
      <div className="profile-note">
        <LockKeyhole size={15} />
        Membership details can only be updated by MOE administrators.
      </div>
    </div>
  )
}
