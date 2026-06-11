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

export function PosterCardPreview({ imageUrl, palette, text, transform, onTransformChange }: Props) {
  const meta = [text.location, text.date].filter(Boolean).join(' · ')

  return (
    <View style={{ width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative' }}>
      <View style={{ width: '100%', paddingTop: '150%', position: 'relative' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <ZoomableImage src={imageUrl} transform={transform} onTransformChange={onTransformChange} />
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }}
      />
      {palette.length > 0 && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, display: 'flex', flexDirection: 'row' }}>
          {palette.map(c => <View key={c.hex} style={{ flex: 1, backgroundColor: c.hex }} />)}
        </View>
      )}
      <View style={{ position: 'absolute', bottom: 32, right: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'right' }}>{text.title || 'My Photo'}</Text>
        {text.subtitle ? (
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'right' }}>{text.subtitle}</Text>
        ) : null}
        {meta ? (
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right' }}>{meta}</Text>
        ) : null}
      </View>
    </View>
  )
}
