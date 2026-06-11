import { View, Text } from '@tarojs/components'
import type { AspectRatio } from '../../types/editor'

const RATIOS: AspectRatio[] = ['1:1', '3:4', '9:16']

interface Props {
  selected: AspectRatio
  onChange: (r: AspectRatio) => void
}

export function AspectRatioSelector({ selected, onChange }: Props) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>比例</Text>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {RATIOS.map(r => (
          <View
            key={r}
            onTap={() => onChange(r)}
            style={{
              flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              backgroundColor: selected === r ? '#6d28d9' : '#f3f4f6',
              color: selected === r ? '#fff' : '#374151',
              fontSize: 13, fontWeight: 500,
            }}
          >
            <Text>{r}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
