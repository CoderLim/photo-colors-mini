import { View, Text } from '@tarojs/components'
import type { TemplateId } from '../../types/editor'

const TEMPLATES = [
  { id: 'classic' as TemplateId, label: '经典' },
  { id: 'music' as TemplateId, label: '氛围' },
  { id: 'poster' as TemplateId, label: '海报' },
]

interface Props {
  selected: TemplateId
  onChange: (id: TemplateId) => void
}

export function TemplateSelector({ selected, onChange }: Props) {
  return (
    <View>
      <Text style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>模板</Text>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {TEMPLATES.map(t => (
          <View
            key={t.id}
            onTap={() => onChange(t.id)}
            style={{
              flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              backgroundColor: selected === t.id ? '#6d28d9' : '#f3f4f6',
              color: selected === t.id ? '#fff' : '#374151',
              fontSize: 13, fontWeight: 500,
            }}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
