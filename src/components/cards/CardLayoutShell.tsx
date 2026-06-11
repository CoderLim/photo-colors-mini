import { View, Text } from '@tarojs/components'
import { ZoomableImage } from '../ZoomableImage'
import { getContrastText } from '../../utils/colorUtils'
import type { PaletteColor, TextContent, ImageTransform, TemplateId } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
  variant: TemplateId
}

function formatDisplayTime(dateStr: string): string {
  const d = dateStr ? new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function buildLocationLine(text: TextContent): string {
  const location = text.location.trim()
  if (location) return location
  return [text.title, text.subtitle].filter(v => v.trim()).join(' • ')
}

export function CardLayoutShell({
  imageUrl,
  palette,
  text,
  transform,
  onTransformChange,
  variant,
}: Props) {
  const bgColor = palette[0]?.hex ?? '#8b9cb3'
  const textColor = getContrastText(bgColor)
  const locationLine = buildLocationLine(text)
  const timeLine = formatDisplayTime(text.date)

  return (
    <View className="card-layout">
      <View
        className="card-layout__meta"
        style={{
          backgroundColor: bgColor,
          ...(variant === 'music' ? { opacity: 0.95 } : {}),
        }}
      >
        {locationLine ? (
          <Text
            className="card-layout__meta-primary"
            style={{ color: textColor }}
          >
            {locationLine}
          </Text>
        ) : null}
        {timeLine ? (
          <Text
            className="card-layout__meta-secondary"
            style={{ color: textColor, opacity: 0.85 }}
          >
            {timeLine}
          </Text>
        ) : null}
      </View>
      <View className="card-layout__photo">
        <View className="card-layout__photo-inner">
          <ZoomableImage
            src={imageUrl}
            transform={transform}
            onTransformChange={onTransformChange}
          />
        </View>
        {variant === 'poster' && palette.length > 0 && (
          <View className="card-layout__palette-bar">
            {palette.map(c => (
              <View
                key={c.hex}
                className="card-layout__palette-segment"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
