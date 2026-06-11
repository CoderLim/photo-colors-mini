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

export function VibeCardPreview({ imageUrl, palette, text, transform, onTransformChange }: Props) {
  const dominantHex = palette[0]?.hex ?? '#1a1a2e'
  const meta = [text.location, text.date].filter(Boolean).join(' · ')

  return (
    <View style={{ width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: dominantHex, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
      <Image
        src={imageUrl}
        style={{
          position: 'absolute',
          width: '125%', height: '125%',
          top: '-12.5%', left: '-12.5%',
          opacity: 0.75,
        }}
        mode="aspectFill"
      />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <View style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 32px' }}>
        <View style={{ width: '80%', borderRadius: 12, overflow: 'hidden', paddingTop: '80%', position: 'relative' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ZoomableImage src={imageUrl} transform={transform} onTransformChange={onTransformChange} />
          </View>
        </View>
        <View style={{ textAlign: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{text.title || 'My Photo'}</Text>
          {text.subtitle ? (
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'block', marginTop: 2 }}>
              {text.subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, display: 'block', marginTop: 4 }}>
              {meta}
            </Text>
          ) : null}
        </View>
        {palette.length > 0 && <ColorSwatch colors={palette} size="md" />}
      </View>
    </View>
  )
}
