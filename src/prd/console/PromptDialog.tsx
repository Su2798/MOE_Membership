import { useEffect, useRef, useState, type FormEvent } from "react"

export type PromptRequest = {
  title: string

  label: string

  type?: "text" | "password"

  minLength?: number

  submitLabel: string

  onSubmit: (value: string) => void
}

export function PromptDialog({
  request,

  onClose,
}: {
  request: PromptRequest | null

  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [value, setValue] = useState("")

  useEffect(() => {
    if (!request) return

    setValue("")

    const dialog = dialogRef.current

    if (!dialog) return

    dialog.showModal()

    return () => dialog.close()
  }, [request])

  if (!request) return null

  const activeRequest = request

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    activeRequest.onSubmit(value)

    onClose()
  }

  return (
    <dialog
      aria-labelledby="prd-prompt-title"
      className="prd-prompt-dialog"
      onCancel={(event) => {
        event.preventDefault()

        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      ref={dialogRef}
    >
      <form className="prd-prompt-form" onSubmit={submit}>
        <h2 id="prd-prompt-title">{request.title}</h2>
        <label className="field">
          {activeRequest.label}
          <input
            autoFocus
            minLength={activeRequest.minLength}
            onChange={(event) => setValue(event.target.value)}
            required
            type={activeRequest.type ?? "text"}
            value={value}
          />
        </label>
        <div className="prd-prompt-actions">
          <button
            className="button button--secondary"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button className="button button--primary" type="submit">
            {activeRequest.submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
