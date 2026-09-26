import 'typed-htmx'

declare module 'hono/jsx' {
  namespace JSX {
    // Merges typed-htmx attributes right into Hono's native JSX engine
    interface HTMLAttributes extends HtmxAttributes {}
  }
}
