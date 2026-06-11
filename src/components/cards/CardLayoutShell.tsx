import { View, Text } from '@tarojs/components'
import { ZoomableImage } from '../ZoomableImage'
import { getContrastText } from '../../utils/colorUtils'
import { buildLocationLine, formatDisplayTime } from '../../utils/cardText'
import { PREVIEW_LAYOUT } from '../../utils/cardLayout'
import type { PaletteColor, TextContent, ImageTransform } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
}

export function CardLayoutShell({
  imageUrl,
  palette,
  text,
  transform,
  onTransformChange,
}: Props) {
  const bgColor = palette[0]?.hex ?? PREVIEW_LAYOUT.classic.defaultBg
  const textColor = getContrastText(bgColor)
  const locationLine = buildLocationLine(text)
  const timeLine = formatDisplayTime(text.date)

  return (
    <View className="card-layout card-layout--classic">
      <View
        className="card-layout__meta"
        style={{ backgroundColor: bgColor }}
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
      </View>
    </View>
  )
}
