import type { TextContent } from '../types/editor'

export function buildLocationLine(text: TextContent): string {
  const location = text.location.trim()
  if (location) return location
  return [text.title, text.subtitle].filter(v => v.trim()).join(' • ')
}

export function buildMetaLine(text: TextContent): string {
  return [text.location.trim(), text.date.trim()].filter(Boolean).join(' · ')
}
