import { APP_JS } from './app-script.ts'
import { COMPOSE_JS } from './compose-script.ts'

// Content fingerprint (djb2) so every change gets a new URL. That lets browsers
// cache scripts forever without ever running a stale one after a deploy.
const fingerprint = (source: string) => {
  let hash = 5381
  for (let i = 0; i < source.length; i++) hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36)
}

const asset = (name: string, source: string) => ({ source, url: `/static/${name}?v=${fingerprint(source)}` })

export const SCRIPTS = {
  app: asset('app.js', APP_JS),
  compose: asset('compose.js', COMPOSE_JS),
}
