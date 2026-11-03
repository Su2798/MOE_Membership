import { useEffect, useRef, type ReactNode } from "react"

export function FormModal({
  title,
  open,
  onClose,
  error,
  description,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  error?: string
  description?: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) dialog.showModal()
    else dialog.close()

    return () => dialog.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      aria-labelledby="prd-form-modal-title"
      className="prd-form-dialog"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      ref={dialogRef}
    >
      <div className="prd-form-dialog-content">
        <div className="prd-form-dialog-heading">
          <div>
            <span className="prd-form-dialog-eyebrow">MOE MEMBERSHIP</span>
            <h2 id="prd-form-modal-title">{title}</h2>
            {description && (
              <p className="prd-form-dialog-description">{description}</p>
            )}
          </div>
          <button
            aria-label="Close dialog"
            className="prd-form-dialog-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {error && (
          <div className="prd-alert error" role="alert">
            {error}
          </div>
        )}
        {children}
      </div>
    </dialog>
  )
}
