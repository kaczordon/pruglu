import { html } from 'hono/html'
import { SCRIPTS } from '../static-assets.ts'

export const Layout = ({ title, children }: { title: string; children: any }) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset@66/tailwind.min.css" />
      <style>[un-cloak] { display: none; }</style>
      <script src="https://cdn.jsdelivr.net/npm/@unocss/runtime@66/uno.global.js"></script>
      <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js"></script>
      <script src="${SCRIPTS.app.url}" defer></script>
    </head>
    <body class="bg-white text-[#222] font-sans" un-cloak>
      ${children}
    </body>
  </html>
`
