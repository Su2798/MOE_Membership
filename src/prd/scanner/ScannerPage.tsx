import jsQR from "jsqr"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"

import { Link } from "react-router"

import {
  addOfflineNote,
  checkIn,
  scannableSessions,
  type CheckInResult,
} from "../../domain/rules"

import { apply, commit, errorMessage, useAuth, useDb } from "../../domain/store"

import { formatDateTime } from "../../domain/time"
import { LocalizedContent } from "../LocalizedContent"
import { FormModal } from "../console/FormModal"

const rejectLabels: Record<string, string> = {
  NOT_AUTHORIZED: "You are not authorized for this session.",

  OFFLINE: "No internet connection. No successful check-in was recorded.",

  INVALID_QR: "This QR code is invalid or has been replaced.",

  ACCOUNT_DISABLED: "This member account is disabled.",

  SESSION_CLOSED: "This session is closed.",

  NO_PLAN: "The member does not have this session's plan.",

  NOT_STARTED: "The member's membership has not started yet.",

  EXPIRED: "The member's membership expired before the meetup date.",

  NO_VISITS_LEFT: "The member has no visits remaining.",

  CANCELLED: "The member's membership is cancelled.",
}

export function ScannerPage() {
  const { user } = useAuth("console")

  const db = useDb()

  const sessions = user ? scannableSessions(db, user.id) : []

  const [sessionId, setSessionId] = useState("")

  const [stream, setStream] = useState<MediaStream | null>(null)

  const [cameraError, setCameraError] = useState("")

  const [result, setResult] = useState<CheckInResult | null>(null)

  const [busy, setBusy] = useState(false)

  const [offlineNote, setOfflineNote] = useState("")

  const [offlineNoteOpen, setOfflineNoteOpen] = useState(false)

  const [notice, setNotice] = useState("")

  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  const videoRef = useRef<HTMLVideoElement>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const streamRef = useRef<MediaStream | null>(null)

  const lockedRef = useRef(false)

  const selectedSession = sessions.find((session) => session.id === sessionId)

  useEffect(() => {
    if (!sessionId && sessions.length)
      setSessionId(sessions.find((session) => session.open)?.id ?? sessions[0].id)
  }, [sessionId, sessions])

  useEffect(() => {
    const online = () => setIsOnline(true)

    const offline = () => setIsOnline(false)

    window.addEventListener("online", online)

    window.addEventListener("offline", offline)

    return () => {
      window.removeEventListener("online", online)

      window.removeEventListener("offline", offline)
    }
  }, [])

  useEffect(() => {
    if (!stream || !videoRef.current) return

    videoRef.current.srcObject = stream

    void videoRef.current
      .play()
      .catch((reason: unknown) => setCameraError(errorMessage(reason)))
  }, [stream])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())

    streamRef.current = null

    setStream(null)
  }, [])

  useEffect(() => {
    if (!isOnline && stream) stopCamera()
  }, [isOnline, stopCamera, stream])

  useEffect(
    () => () => {
      stream?.getTracks().forEach((track) => track.stop())
    },
    [stream],
  )

  const recordScan = useCallback(
    (qrText: string) => {
      if (!user || !sessionId || lockedRef.current) return

      lockedRef.current = true

      setBusy(true)

      setNotice("")

      try {
        const scanResult = commit((current, now) => {
          const checked = checkIn(
            current,

            { operatorId: user.id, sessionId, qrText, online: isOnline },

            now,
          )

          return { db: checked.db, value: checked.result }
        })

        setResult(scanResult)

        stopCamera()
      } catch (reason) {
        setResult({
          kind: "rejected",
          reason: "NOT_AUTHORIZED",
          detail: errorMessage(reason),
        })

        stopCamera()
      } finally {
        setBusy(false)
      }
    },
    [isOnline, sessionId, stopCamera, user],
  )

  useEffect(() => {
    if (!stream || !selectedSession || result) return

    let frame = 0

    let active = true

    const scanFrame = () => {
      const video = videoRef.current

      const canvas = canvasRef.current

      if (!active || lockedRef.current) return

      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        const context = canvas.getContext("2d", { willReadFrequently: true })

        if (context) {
          canvas.width = video.videoWidth

          canvas.height = video.videoHeight

          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const image = context.getImageData(0, 0, canvas.width, canvas.height)

          const code = jsQR(image.data, image.width, image.height, {
            inversionAttempts: "dontInvert",
          })

          if (code?.data) {
            recordScan(code.data)

            return
          }
        }
      }

      frame = requestAnimationFrame(scanFrame)
    }

    frame = requestAnimationFrame(scanFrame)

    return () => {
      active = false

      cancelAnimationFrame(frame)
    }
  }, [recordScan, result, selectedSession, stream])

  async function startCamera() {
    setCameraError("")

    setResult(null)

    setNotice("")

    lockedRef.current = false

    if (!isOnline) {
      setCameraError(
        "Internet connection is required to record a successful check-in.",
      )

      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access requires HTTPS or localhost and a supported browser.",
      )

      return
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,

        video: { facingMode: { ideal: "environment" } },
      })

      streamRef.current = nextStream

      setStream(nextStream)
    } catch (reason) {
      setCameraError(errorMessage(reason))
    }
  }

  function saveOfflineNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user || !sessionId) return

    const note = offlineNote.trim()

    if (!note) return

    try {
      apply((current, now) =>
        addOfflineNote(current, user.id, sessionId, note, now),
      )

      setOfflineNote("")
      setOfflineNoteOpen(false)

      setNotice(
        "Offline note saved for Admin review. This is not a successful check-in and no visit was deducted.",
      )
    } catch (reason) {
      setCameraError(errorMessage(reason))
    }
  }

  function scanNext() {
    setResult(null)

    lockedRef.current = false

    if (isOnline) void startCamera()
  }

  if (!user) return null

  const roleDenied = user.role !== "admin" && user.role !== "staff"

  if (roleDenied)
    return (
      <LocalizedContent>
      <div className="card prd-empty">
        <h1>Scanner access denied</h1>
      </div>
      </LocalizedContent>
    )

  return (
    <LocalizedContent>
    <div className="prd-page prd-scanner-page">
      <div className="prd-page-heading">
        <div>
          <p className="prd-eyebrow">AUTHORIZED SCANNER</p>
          <h1>Meetup check-in</h1>
          <p>
            Confirm the person matches the member details before accepting the
            check-in.
          </p>
        </div>
        <Link className="button button--secondary" to="/console">
          Back to console
        </Link>
      </div>
      <div className="prd-alert warning">
        {isOnline
          ? "Online connection is required. An offline scan is never shown as successful."
          : "Offline: do not treat scans as successful. Record a separate note for Admin review."}
      </div>
      <section className="card prd-scanner-controls">
        <label className="field">
          Plan and meetup session
          <select
            value={sessionId}
            onChange={(event) => {
              setSessionId(event.target.value)

              setResult(null)

              lockedRef.current = false

              stopCamera()
            }}
          >
            {sessions.map((session) => (
              <option value={session.id} key={session.id}>
                {db.plans.find((plan) => plan.id === session.planId)?.name} ·{" "}
                {session.name} · {session.date}
                {session.open ? "" : " (closed)"}
              </option>
            ))}
          </select>
        </label>
        {selectedSession && (
          <p className="prd-session-status">
            Session state:{" "}
            <strong>
              {selectedSession.open
                ? "Open for check-in"
                : "Closed — scans will be rejected"}
            </strong>
          </p>
        )}
        {!selectedSession && (
          <p>
            No sessions are assigned to your account. Ask an Admin to assign an
            open session.
          </p>
        )}
      </section>
      <section className="card prd-scanner-card">
        {selectedSession && !result && (
          <>
            <div className="prd-camera-view">
              {stream ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  aria-label="Live member QR camera view"
                />
              ) : (
                <div className="prd-camera-placeholder">
                  <span>Camera preview</span>
                  <p>Allow camera access to scan a member's personal QR.</p>
                </div>
              )}
              <div className="prd-scan-guide" aria-hidden="true" />
            </div>
            <canvas ref={canvasRef} className="prd-hidden-canvas" />
            <div className="prd-camera-actions">
              {!stream ? (
                <button
                  className="button button--primary button--large"
                  disabled={busy || !isOnline}
                  onClick={() => void startCamera()}
                >
                  Start camera scanner
                </button>
              ) : (
                <button
                  className="button button--secondary"
                  onClick={stopCamera}
                >
                  Stop camera
                </button>
              )}
            </div>
          </>
        )}
        {busy && <p role="status">Checking membership eligibility…</p>}
        {result && <ScanResult result={result} onNext={scanNext} />}
        {cameraError && (
          <p className="prd-error" role="alert">
            {cameraError}
          </p>
        )}
        {notice && (
          <p className="prd-success" role="status">
            {notice}
          </p>
        )}
      </section>
      {!isOnline && selectedSession && (
        <section className="card">
          <div className="prd-card-heading">
            <div>
              <h2>Record an offline note</h2>
              <p>
                No attendance or visit usage will be recorded now. An Admin must
                verify and backfill later.
              </p>
            </div>
            <button
              className="button button--secondary"
              onClick={() => setOfflineNoteOpen(true)}
              type="button"
            >
              Record offline note
            </button>
          </div>
          <FormModal
            title="Record an offline note"
            open={offlineNoteOpen}
            onClose={() => setOfflineNoteOpen(false)}
            error={cameraError}
          >
            <form className="prd-form-grid" onSubmit={saveOfflineNote}>
            <label className="field prd-form-wide">
              Member name/number and notes
              <input
                value={offlineNote}
                onChange={(event) => setOfflineNote(event.target.value)}
                required
              />
            </label>
            <button className="button button--secondary">
              Save offline note
            </button>
            </form>
          </FormModal>
        </section>
      )}
      {!isOnline && !selectedSession && (
        <p className="prd-subtitle">
          Reconnect to the internet before recording check-ins.
        </p>
      )}
    </div>
    </LocalizedContent>
  )
}

function ScanResult({
  result,
  onNext,
}: {
  result: CheckInResult
  onNext: () => void
}) {
  if (result.kind === "rejected") {
    return (
      <LocalizedContent>
      <div className="prd-scan-result rejected">
        <div className="prd-result-icon">!</div>
        <p className="prd-eyebrow">CHECK-IN NOT RECORDED</p>
        <h2>
          {rejectLabels[result.reason] ?? result.detail ?? "Check-in rejected."}
        </h2>
        {result.member && <MemberIdentity member={result.member} />}
        {result.detail && result.detail !== rejectLabels[result.reason] && (
          <p>{result.detail}</p>
        )}
        <p>Attendance and visit balance were not changed.</p>
        <button className="button button--secondary" onClick={onNext}>
          Scan another member
        </button>
      </div>
      </LocalizedContent>
    )
  }

  const already = result.kind === "already"

  return (
    <LocalizedContent>
    <div className={`prd-scan-result ${already ? "already" : "success"}`}>
      <div className="prd-result-icon">{already ? "✓" : "✓"}</div>
      <p className="prd-eyebrow">
        {already ? "ALREADY CHECKED IN" : "CHECK-IN SUCCESSFUL"}
      </p>
      <MemberIdentity member={result.member} />
      <h2>{result.planName}</h2>
      <p>{result.sessionName}</p>
      <p>{formatDateTime(result.checkedInAt)}</p>
      <div className="prd-result-visits">
        <span>
          Used
          <strong>
            {result.used} / {result.total}
          </strong>
        </span>
        <span>
          Remaining<strong>{result.remaining}</strong>
        </span>
      </div>
      {already && (
        <p>
          The original check-in time is shown. No additional visit was deducted.
        </p>
      )}
      <button className="button button--primary" onClick={onNext}>
        Scan next member
      </button>
    </div>
    </LocalizedContent>
  )
}

function MemberIdentity({
  member,
}: {
  member: { name: string; memberNo: string; photoUrl?: string }
}) {
  return (
    <div className="prd-member-identity">
      {member.photoUrl ? (
        <img src={member.photoUrl} alt="" />
      ) : (
        <span>
          {member.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
      <div>
        <strong>{member.name}</strong>
        <small>{member.memberNo}</small>
      </div>
    </div>
  )
}
