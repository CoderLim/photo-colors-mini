import { View, Text } from '@tarojs/components'
import { ZoomableImage } from '../ZoomableImage'
import { ColorSwatch } from '../palette/ColorSwatch'
import { getContrastText } from '../../utils/colorUtils'
import type { PaletteColor, TextContent, AspectRatio, ImageTransform } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
}

export function ClassicCardPreview({ imageUrl, palette, text, transform, onTransformChange }: Props) {
  const bgColor = palette[0]?.hex ?? '#f5f5f5'
  const textColor = getContrastText(bgColor)
  const meta = [text.location, text.date].filter(Boolean).join(' · ')

  return (
    <View style={{ width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
      <View style={{ width: '100%', paddingTop: '70%', position: 'relative' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ZoomableImage src={imageUrl} transform={transform} onTransformChange={onTransformChange} />
        </View>
      </View>
      <View style={{ backgroundColor: bgColor, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <View>
          <Text style={{ color: textColor, fontSize: 15, fontWeight: 700 }}>{text.title || 'My Photo'}</Text>
          {text.subtitle ? (
            <Text style={{ color: textColor, fontSize: 13, opacity: 0.7, display: 'block', marginTop: 2 }}>
              {text.subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={{ color: textColor, fontSize: 11, opacity: 0.5, display: 'block', marginTop: 4 }}>
              {meta}
            </Text>
          ) : null}
        </View>
        {palette.length > 0 && <ColorSwatch colors={palette} size="sm" />}
      </View>
    </View>
  )
}
