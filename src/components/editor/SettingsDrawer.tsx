import { View, Text } from '@tarojs/components'
import { Popup } from '@nutui/nutui-taro'
import { TemplateSelector } from './TemplateSelector'
import { AspectRatioSelector } from './AspectRatioSelector'
import { TextEditor } from './TextEditor'
import type { EditorState, TemplateId, AspectRatio, TextContent } from '../../types/editor'

interface Props {
  visible: boolean
  onClose: () => void
  state: Pick<EditorState, 'templateId' | 'aspectRatio' | 'text'>
  onTemplate: (id: TemplateId) => void
  onAspectRatio: (r: AspectRatio) => void
  onText: (field: keyof TextContent, value: string) => void
}

export function SettingsDrawer({ visible, onClose, state, onTemplate, onAspectRatio, onText }: Props) {
  return (
    <Popup
      visible={visible}
      position="bottom"
      round
      onClose={onClose}
      style={{ maxHeight: '80vh', overflow: 'hidden' }}
    >
      <View style={{ padding: '0 16px 32px' }}>
        <View style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' }} />
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: 600 }}>调整设置</Text>
          <View onClick={onClose} style={{ padding: '4px 8px' }}>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>✕</Text>
          </View>
        </View>
        <View style={{ overflowY: 'auto', maxHeight: '65vh' }}>
          <TemplateSelector selected={state.templateId} onChange={onTemplate} />
          <AspectRatioSelector selected={state.aspectRatio} onChange={onAspectRatio} />
          <TextEditor text={state.text} onChange={onText} />
        </View>
      </View>
    </Popup>
  )
}
