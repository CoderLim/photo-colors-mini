import { View } from '@tarojs/components'
import type { PaletteColor } from '../../types/editor'

interface ColorSwatchProps {
  colors: PaletteColor[]
  size?: 'sm' | 'md'
}

const sizeMap = { sm: 24, md: 32 }

export function ColorSwatch({ colors, size = 'md' }: ColorSwatchProps) {
  const px = sizeMap[size]
  return (
    <View style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {colors.map(c => (
        <View
          key={c.hex}
          style={{
            width: px, height: px,
            borderRadius: px / 2,
            backgroundColor: c.hex,
            border: '1.5px solid rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </View>
  )
}
