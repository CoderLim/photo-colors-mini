import { View, Text, Input } from '@tarojs/components'
import type { TextContent } from '../../types/editor'

interface Props {
  text: TextContent
  onChange: (field: keyof TextContent, value: string) => void
}

const FIELDS: { key: keyof TextContent; label: string; placeholder: string }[] = [
  { key: 'title', label: '标题', placeholder: 'My Photo' },
  { key: 'subtitle', label: '副标题', placeholder: 'A moment in time' },
  { key: 'location', label: '地点', placeholder: 'Paris' },
  { key: 'date', label: '日期', placeholder: '2026-06-11' },
]

export function TextEditor({ text, onChange }: Props) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>文字</Text>
      <View style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FIELDS.map(f => (
          <View key={f.key}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{f.label}</Text>
            <Input
              value={text[f.key]}
              placeholder={f.placeholder}
              onInput={e => onChange(f.key, e.detail.value)}
              style={{
                height: 36, border: '1px solid #e5e7eb', borderRadius: 8,
                paddingLeft: 10, fontSize: 14, backgroundColor: '#fff',
              }}
            />
          </View>
        ))}
      </View>
    </View>
  )
}
