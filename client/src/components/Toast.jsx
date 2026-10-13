import React, { useEffect } from 'react'
import { CheckIcon, AlertTriangleIcon, XIcon } from './Icons'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const isUrgent = toast.type === 'error' || toast.type === 'sos'

  return (
    <div className={`toast-notification ${isUrgent ? 'toast-sos' : 'toast-success'}`} role="status" aria-live="polite">
      <div className="toast-icon">
        {isUrgent ? <AlertTriangleIcon size={18} /> : <CheckIcon size={18} />}
      </div>
      <div className="toast-content">
        <p className="toast-title">{toast.title || 'Notification'}</p>
        <p className="toast-message">{toast.message}</p>
      </div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        <XIcon size={14} />
      </button>
    </div>
  )
}
