import { toast as sonnerToast } from 'sonner'

/**
 * Show a success toast notification
 */
export function showSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 3000,
  })
}

/**
 * Show an error toast notification
 */
export function showError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    duration: 5000,
  })
}

/**
 * Show an info toast notification
 */
export function showInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 3000,
  })
}

/**
 * Show a warning toast notification
 */
export function showWarning(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * Show a loading toast notification
 */
export function showLoading(message: string) {
  return sonnerToast.loading(message)
}

/**
 * Dismiss a toast notification
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId)
}
