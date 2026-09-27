// Served at /static/compose.js. Kept as a string so it ships as-is (no bundler step).
// Everything is delegated from `document`, so it keeps working after htmx swaps.
export const COMPOSE_JS = `(() => {
  const $ = (sel) => document.querySelector(sel)
  let savedRange = null

  const syncBody = () => {
    const editor = $('#editor'), out = $('#body-input')
    if (editor && out) out.value = editor.innerHTML
  }

  // Remember the caret so toolbar selects/colour pickers can act on it after stealing focus
  document.addEventListener('selectionchange', () => {
    const editor = $('#editor'), sel = getSelection()
    if (editor && sel.rangeCount && editor.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange()
  })

  const exec = (cmd, value = null) => {
    const editor = $('#editor')
    if (!editor || !cmd) return
    editor.focus()
    if (savedRange) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(savedRange) }
    if (cmd === 'align') { cmd = value; value = null }
    if (cmd === 'insertRecipient') { cmd = 'insertText'; value = '{{recipient_name}}' }
    if (cmd === 'createLink' || cmd === 'insertImage') {
      value = prompt(cmd === 'createLink' ? 'Link URL' : 'Image URL', 'https://')
      if (!value || !/^https?:\\/\\/\\S+$/i.test(value)) return
    }
    document.execCommand(cmd, false, value)
    syncBody()
  }

  // Keep focus in the editor when pressing toolbar buttons
  document.addEventListener('mousedown', (e) => {
    if (e.target.closest && e.target.closest('button[data-cmd]')) e.preventDefault()
  })
  document.addEventListener('click', (e) => {
    const button = e.target.closest && e.target.closest('button[data-cmd]')
    if (button) { e.preventDefault(); exec(button.dataset.cmd) }
  })
  document.addEventListener('input', (e) => { if (e.target.id === 'editor') syncBody() })
  document.addEventListener('htmx:afterSettle', syncBody)

  const refreshGroup = (group) => {
    const members = [...group.querySelectorAll('input[data-member]')]
    const checked = members.filter((m) => m.checked).length
    const all = group.querySelector('input[data-list]')
    all.checked = members.length > 0 && checked === members.length
    all.indeterminate = checked > 0 && checked < members.length
    group.querySelector('[data-count]').textContent = checked
  }

  // Capture phase: checkbox state is settled before htmx serialises the form on bubble
  document.addEventListener('change', (e) => {
    const t = e.target
    const group = t.closest && t.closest('[data-group]')
    if (group) {
      if (t.matches('input[data-list]')) group.querySelectorAll('input[data-member]').forEach((m) => { m.checked = t.checked })
      refreshGroup(group)
    }
    if (t.matches('select[data-cmd], input[data-cmd]')) {
      exec(t.dataset.cmd, t.value)
      if (t.tagName === 'SELECT') t.selectedIndex = 0
    }
    if (t.id === 'attachments') {
      const n = t.files.length
      $('#attachments-label').textContent = n ? n + (n === 1 ? ' file' : ' files') : 'Upload Files'
    }
  }, true)

  // A checkbox inside <summary> shouldn't also open/close the row
  document.addEventListener('click', (e) => {
    if (e.target.matches && e.target.matches('summary input[type=checkbox]')) {
      const details = e.target.closest('details'), open = details.open
      requestAnimationFrame(() => { details.open = open })
    }
  })
})()
`
