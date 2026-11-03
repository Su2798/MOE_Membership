import { translate } from "../i18n"

export function LanguageSwitch({
  language,
  onChange,
}: {
  language: "en" | "my"
  onChange: (language: "en" | "my") => void
}) {
  const label = translate("Language", language === "my" ? "MY" : "EN")

  return (
    <div className="prd-language-switch" role="group" aria-label={label}>
      {(["en", "my"] as const).map((option) => (
        <button
          aria-pressed={language === option}
          className={`prd-language-option ${
            language === option ? "active" : ""
          }`}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
