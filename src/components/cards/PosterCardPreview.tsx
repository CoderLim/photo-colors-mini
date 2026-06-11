import { View, Text } from '@tarojs/components'
import { ZoomableImage } from '../ZoomableImage'
import type { PaletteColor, TextContent, AspectRatio, ImageTransform } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
}

export function PosterCardPreview({
  imageUrl,
  palette,
  text,
  transform,
  onTransformChange,
}: Props) {
  const meta = [text.location, text.date].filter(Boolean).join(' · ')

  return (
    <View className="poster-card">
      <View className="poster-card__photo">
        <ZoomableImage
          src={imageUrl}
          transform={transform}
          onTransformChange={onTransformChange}
        />
      </View>

      <View className="poster-card__overlay" />

      {palette.length > 0 && (
        <View className="poster-card__palette-bar">
          {palette.map(c => (
            <View
              key={c.hex}
              className="poster-card__palette-segment"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </View>
      )}

      <View className="poster-card__text">
        <Text className="poster-card__title">{text.title || 'My Photo'}</Text>
        {text.subtitle ? (
          <Text className="poster-card__subtitle">{text.subtitle}</Text>
        ) : null}
        {meta ? (
          <Text className="poster-card__meta">{meta}</Text>
        ) : null}
      </View>
    </View>
  )
}
