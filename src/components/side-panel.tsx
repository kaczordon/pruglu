import { raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { ChevronLeftIcon } from './icons.tsx'

// A checkbox + label pair hides the panel on md+ screens without any JS, so
// whatever state lives inside the panel (ticks, search text) is never lost.
// The panel element must carry the `side-panel` class.
const CSS = `
@media (min-width: 768px) { .side-toggle:checked ~ .side-panel { display: none } }
.side-toggle:checked ~ .side-handle .chev { transform: rotate(180deg) }
`

export const CollapsibleSide = ({ id, label, panel }: { id: string; label: string; panel: Child }) => (
  <>
    <style>{raw(CSS)}</style>
    <input type="checkbox" id={id} class="side-toggle hidden" />
    {panel}
    <label
      for={id}
      title={`Show or hide ${label.toLowerCase()}`}
      class="side-handle hidden md:flex h-fit w-8 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-br-xl bg-[#2b2b2b] py-3 text-xs font-semibold text-white"
    >
      <span class="[writing-mode:vertical-rl]">{label}</span>
      <ChevronLeftIcon class="chev transition-transform" />
    </label>
  </>
)
