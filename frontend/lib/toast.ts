export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration: number
}

class ToastEmitter extends EventTarget {
  emit(message: string, type: ToastType = 'info', duration: number = 4000) {
    const id = Math.random().toString(36).slice(2)
    const event = new CustomEvent('toast', {
      detail: { id, message, type, duration } satisfies ToastMessage,
    })
    this.dispatchEvent(event)
  }
}

export const toastEmitter = new ToastEmitter()

export function toast(message: string, type: ToastType = 'info', duration = 4000) {
  toastEmitter.emit(message, type, duration)
}

export function toastSuccess(message: string, duration = 4000) {
  toast(message, 'success', duration)
}

export function toastError(message: string, duration = 4000) {
  toast(message, 'error', duration)
}

export function toastWarning(message: string, duration = 4000) {
  toast(message, 'warning', duration)
}

export function toastInfo(message: string, duration = 4000) {
  toast(message, 'info', duration)
}
