import type { TextContent } from '../types/editor'

export function formatDisplayTime(dateStr: string): string {
  const d = dateStr ? new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function buildLocationLine(text: TextContent): string {
  const location = text.location.trim()
  if (location) return location
  return [text.title, text.subtitle].filter(v => v.trim()).join(' • ')
}

export function buildMetaLine(text: TextContent): string {
  return [text.location.trim(), text.date.trim()].filter(Boolean).join(' · ')
}
