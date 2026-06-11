import { View, Text } from '@tarojs/components'
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

/**
 * 底部设置抽屉（纯 Taro 实现，避免在 React 项目中误用 Vue 版 NutUI 组件）
 */
export function SettingsDrawer({ visible, onClose, state, onTemplate, onAspectRatio, onText }: Props) {
  if (!visible) return null

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onTap={onClose}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '80vh',
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: '0 16px 32px' }}>
          <View style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' }} />
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: 600 }}>调整设置</Text>
            <View onTap={onClose} style={{ padding: '4px 8px' }}>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>✕</Text>
            </View>
          </View>
          <View style={{ overflowY: 'auto', maxHeight: '65vh' }}>
            <TemplateSelector selected={state.templateId} onChange={onTemplate} />
            <AspectRatioSelector selected={state.aspectRatio} onChange={onAspectRatio} />
            <TextEditor text={state.text} onChange={onText} />
          </View>
        </View>
      </View>
    </View>
  )
}
