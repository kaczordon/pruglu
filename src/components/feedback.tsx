import type { Child } from 'hono/jsx'
import { CheckCircleIcon, CloseIcon, InfoIcon } from './icons.tsx'
import { GREEN } from './theme.ts'

// ---- Dialogs -------------------------------------------------------------------------
//
// Dialog partials are swapped into #modal-root (in Shell); app.js opens anything marked
// data-autoshow as a real modal. A successful action answers with `HX-Trigger:
// close-dialog`; a failed one retargets its message into #dialog-error.

export const Dialog = ({ title, subtitle, children }: { title: string; subtitle?: Child; children: Child }) => (
  <dialog
    data-autoshow
    aria-labelledby="dialog-title"
    class="w-[min(560px,calc(100vw-2rem))] rounded-2xl p-8 shadow-xl backdrop:bg-black/40"
  >
    <button
      type="button"
      data-close-dialog
      aria-label="Close"
      class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100"
    >
      <CloseIcon />
    </button>
    <div class="flex flex-col items-center text-center">
      <span class="grid h-14 w-14 place-items-center rounded-full bg-gray-500 text-2xl font-bold text-white">i</span>
      <h2 id="dialog-title" class="mt-4 text-2xl font-bold">
        {title}
      </h2>
      {subtitle && <p class="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </dialog>
)

export const DialogError = () => <p id="dialog-error" class="mt-2 min-h-5 text-sm text-red-600" aria-live="polite" />

export const DialogActions = ({ confirm }: { confirm: string }) => (
  <div class="mt-4 flex items-center justify-end gap-6">
    <button type="button" data-close-dialog class="font-semibold text-gray-700 hover:text-black">
      Cancel
    </button>
    <button class="rounded-full px-8 py-2.5 font-semibold text-white shadow hover:brightness-110" style={`background:${GREEN}`}>
      {confirm}
    </button>
  </div>
)

export const FIELD = 'w-full rounded-full border border-gray-300 bg-gray-50 px-5 py-3 outline-none focus:border-gray-500'

// ---- Toasts --------------------------------------------------------------------------

// Appended to #toasts (in Shell); app.js removes it after a few seconds or on ✕
export const Toast = ({ message, tone = 'success' }: { message: string; tone?: 'success' | 'info' | 'error' }) => (
  <div
    role="status"
    class="toast pointer-events-auto flex w-[min(520px,calc(100vw-2rem))] items-center gap-3 rounded-full px-5 py-3 text-white shadow-lg"
    style={`background:${tone === 'error' ? '#dc2626' : GREEN}`}
  >
    {tone === 'success' ? <CheckCircleIcon class="shrink-0" /> : <InfoIcon class="shrink-0" />}
    <span class="flex-1">{message}</span>
    <button data-dismiss-toast aria-label="Dismiss" class="grid h-7 w-7 place-items-center rounded-full hover:bg-white/20">
      <CloseIcon />
    </button>
  </div>
)

// A toast riding along with some other swap, as an out-of-band append
export const ToastOob = (props: Parameters<typeof Toast>[0]) => (
  <div hx-swap-oob="beforeend:#toasts">
    <Toast {...props} />
  </div>
)

export const FeedbackRoots = () => (
  <>
    <div id="modal-root" />
    <div id="toasts" class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2" aria-live="polite" />
  </>
)
