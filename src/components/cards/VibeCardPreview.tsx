import { View, Text, Image } from '@tarojs/components'
import { ZoomableImage } from '../ZoomableImage'
import { ColorSwatch } from '../palette/ColorSwatch'
import type { PaletteColor, TextContent, AspectRatio, ImageTransform } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
}

export function VibeCardPreview({
  imageUrl,
  palette,
  text,
  transform,
  onTransformChange,
}: Props) {
  const dominantHex = palette[0]?.hex ?? '#1a1a2e'
  const meta = [text.location, text.date].filter(Boolean).join(' · ')

  return (
    <View className="vibe-card" style={{ backgroundColor: dominantHex }}>
      <Image
        className="vibe-card__blur-bg"
        src={imageUrl}
        mode="aspectFill"
      />
      <View className="vibe-card__overlay" />

      <View className="vibe-card__content">
        <View className="vibe-card__photo-wrap">
          <ZoomableImage
            src={imageUrl}
            transform={transform}
            onTransformChange={onTransformChange}
          />
        </View>

        <View className="vibe-card__text">
          <Text className="vibe-card__title">{text.title || 'My Photo'}</Text>
          {text.subtitle ? (
            <Text className="vibe-card__subtitle">{text.subtitle}</Text>
          ) : null}
          {meta ? (
            <Text className="vibe-card__meta">{meta}</Text>
          ) : null}
        </View>

        {palette.length > 0 && (
          <ColorSwatch colors={palette} size="md" />
        )}
      </View>
    </View>
  )
}
