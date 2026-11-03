import {
  X,
  Search,
  Inbox,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Children,
  type ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react"
import { translate } from "../../i18n"
import { useAppState } from "../../state/AppState"

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  "aria-label": ariaLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: ReactNode
}) {
  const { language } = useAppState()
  return (
    <button
      className={`button button--${variant} ${className}`}
      aria-label={ariaLabel ? translate(ariaLabel, language) : undefined}
      {...props}
    >
      {icon}
      {typeof children === "string" ? translate(children, language) : children}
    </button>
  )
}

export function Field({
  label,
  error,
  helper,
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  helper?: string
}) {
  const { language } = useAppState()
  return (
    <label className="field">
      <span>{translate(label, language)}</span>
      <input
        className={error ? "is-error" : ""}
        placeholder={
          placeholder ? translate(placeholder, language) : undefined
        }
        {...props}
      />
      {error && <small className="field-error">{translate(error, language)}</small>}
      {helper && !error && <small>{translate(helper, language)}</small>}
    </label>
  )
}

export function TextArea({
  label,
  placeholder,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { language } = useAppState()
  return (
    <label className="field">
      <span>{translate(label, language)}</span>
      <textarea
        placeholder={
          placeholder ? translate(placeholder, language) : undefined
        }
        {...props}
      />
    </label>
  )
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  children: ReactNode
}) {
  const { language } = useAppState()
  const translatedChildren = Children.map(children, (child) => {
    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.type === "option" &&
      typeof child.props.children === "string"
    ) {
      return cloneElement(child, {}, translate(child.props.children, language))
    }
    return child
  })
  const select = <select {...props}>{translatedChildren}</select>
  return label ? (
    <label className="field">
      <span>{translate(label, language)}</span>
      {select}
    </label>
  ) : (
    select
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const { language } = useAppState()
  return (
    <div className="search">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={translate(placeholder, language)}
        aria-label={translate(placeholder, language)}
      />
    </div>
  )
}

export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  const { language } = useAppState()
  return (
    <div className="page-heading">
      <div>
        <h1>{translate(title, language)}</h1>
        {description && <p>{translate(description, language)}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`card ${className}`}>{children}</section>
}

export function StatusBadge({ status }: { status: string }) {
  const { language } = useAppState()
  return (
    <span
      className={`status status--${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {translate(status, language)}
    </span>
  )
}

export function Modal({
  open,
  title,
  children,
  onClose,
  actions,
  className = "",
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  actions?: ReactNode
  className?: string
}) {
  const { language } = useAppState()
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{translate(title, language)}</h2>
          <Button
            variant="ghost"
            icon={<X size={19} />}
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

export function Toast({
  message,
  tone = "success",
  onClose,
}: {
  message: string
  tone?: "success" | "error"
  onClose: () => void
}) {
  const { language } = useAppState()
  return (
    <div className={`toast toast--${tone}`}>
      <span>{translate(message, language)}</span>
      <Button
        variant="ghost"
        icon={<X size={16} />}
        aria-label="Close"
        onClick={onClose}
      />
    </div>
  )
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  const { language } = useAppState()
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={25} />
      </div>
      <h2>{translate(title, language)}</h2>
      {description && <p>{translate(description, language)}</p>}
      {action}
    </div>
  )
}

export function LoadingState({ title = "Loading..." }: { title?: string }) {
  const { language } = useAppState()
  return (
    <div className="loading">
      <LoaderCircle size={28} className="spin" />
      <span>{translate(title, language)}</span>
    </div>
  )
}

export function Pagination() {
  const { language } = useAppState()
  return (
    <div className="pagination">
      <span>{translate("Showing 1–5 of 24", language)}</span>
      <div>
        <Button
          variant="secondary"
          icon={<ChevronLeft size={16} />}
          aria-label={translate("Previous", language)}
        />
        <Button variant="primary">1</Button>
        <Button variant="ghost">2</Button>
        <Button variant="ghost">3</Button>
        <Button
          variant="secondary"
          icon={<ChevronRight size={16} />}
          aria-label={translate("Next", language)}
        />
      </div>
    </div>
  )
}

export function DataTable({
  columns,
  children,
  className = "",
}: {
  columns: string[]
  children: ReactNode
  className?: string
}) {
  const { language } = useAppState()
  return (
    <div className={`table-wrap ${className}`}>
      <table className={className ? `${className}__table` : undefined}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{translate(column, language)}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  const { language } = useAppState()
  return (
    <div className="detail-row">
      <span>{translate(label, language)}</span>
      <strong>{value}</strong>
    </div>
  )
}
