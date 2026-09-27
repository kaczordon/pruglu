// Served at /static/app.js on every page. Small, delegated from `document`, so it
// keeps working for content htmx swaps in later.
export const APP_JS = `(() => {
  const all = (sel) => [...document.querySelectorAll(sel)]

  // Dropdown menus are <details data-dropdown>: only one open, closed by outside click,
  // picking an item, or Escape
  const closeMenus = (except) => all('details[data-dropdown][open]').forEach((d) => { if (d !== except) d.open = false })
  document.addEventListener('click', (e) => {
    const menu = e.target.closest && e.target.closest('details[data-dropdown]')
    closeMenus(menu)
    if (menu && e.target.closest('[role=menuitem]')) menu.open = false
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    closeMenus()
    const nav = document.getElementById('nav-open')
    if (nav && nav.checked) nav.checked = false
  })

  // "Select all" checkbox for tables of .contact-check rows
  const syncSelectAll = () => {
    const box = document.querySelector('[data-select-all]')
    if (!box) return
    const rows = all('.contact-check'), ticked = rows.filter((r) => r.checked).length
    box.checked = rows.length > 0 && ticked === rows.length
    box.indeterminate = ticked > 0 && ticked < rows.length
  }
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-select-all]')) all('.contact-check').forEach((r) => { r.checked = e.target.checked })
    if (e.target.matches('.contact-check')) syncSelectAll()
  })

  // Dialogs the server sends are opened as real modals; the server closes them via HX-Trigger
  document.addEventListener('htmx:afterSwap', () => {
    syncSelectAll()
    // Once only: HX-Trigger closes a dialog before the swap, so don't reopen it here
    all('dialog[data-autoshow]:not([data-shown])').forEach((d) => {
      d.dataset.shown = '1'
      d.showModal()
    })
    all('.toast:not([data-timed])').forEach((t) => {
      t.dataset.timed = '1'
      setTimeout(() => t.remove(), 5000)
    })
  })
  // htmx ignores error responses by default, which makes a click look dead. Say so instead.
  const errorToast = (message) => {
    const toasts = document.getElementById('toasts')
    if (!toasts) return
    const toast = document.createElement('div')
    toast.className = 'toast pointer-events-auto flex w-[min(520px,calc(100vw-2rem))] items-center gap-3 rounded-full px-5 py-3 text-white shadow-lg'
    toast.style.background = '#dc2626'
    toast.setAttribute('role', 'alert')
    toast.textContent = message
    toasts.append(toast)
    setTimeout(() => toast.remove(), 6000)
  }
  document.addEventListener('htmx:responseError', (e) => {
    const status = e.detail.xhr.status
    errorToast(status === 404 ? 'That item no longer exists. Try reloading the page.' : 'Something went wrong (' + status + '). Please try again.')
  })
  document.addEventListener('htmx:sendError', () => errorToast('Could not reach the server. Check your connection.'))

  document.addEventListener('close-dialog', () => all('dialog[open]').forEach((d) => d.close()))
  document.addEventListener('click', (e) => {
    const close = e.target.closest && e.target.closest('[data-close-dialog]')
    if (close) close.closest('dialog').close()
  })

  document.addEventListener('click', (e) => {
    const dismiss = e.target.closest && e.target.closest('[data-dismiss-toast]')
    if (dismiss) dismiss.closest('.toast').remove()
  })
})()
`
