import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { useEditorState } from '../../hooks/useEditorState'
import { extractPaletteFromRegion } from '../../utils/extractPalette'
import { exportAndSave } from '../../utils/canvasExport'
import { getCardImageAspect } from '../../utils/templateConfig'
import { ClassicCardPreview } from '../../components/cards/ClassicCardPreview'
import { VibeCardPreview } from '../../components/cards/VibeCardPreview'
import { PosterCardPreview } from '../../components/cards/PosterCardPreview'
import { SettingsDrawer } from '../../components/editor/SettingsDrawer'
import './index.scss'

const toolbarBtnStyle: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 4, padding: '12px 0',
}

export default function Index() {
  const { state, setImage, setPalette, setTemplate, setAspectRatio, setText, setExportStatus, setTransform } = useEditorState()
  const [drawerVisible, setDrawerVisible] = useState(false)

  const handleChooseImage = () => {
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const path = res.tempFiles[0].tempFilePath
        setImage(path)
      },
    })
  }

  useEffect(() => {
    if (!state.imageUrl || !state.isExtractingPalette) return
    const aspect = getCardImageAspect(state.templateId, state.aspectRatio)
    extractPaletteFromRegion(state.imageUrl, 5, state.imageTransform, aspect)
      .then(setPalette)
      .catch(() => setPalette([]))
  }, [state.imageUrl, state.isExtractingPalette, state.templateId, state.aspectRatio, setPalette])

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!state.imageUrl || state.isExtractingPalette) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const aspect = getCardImageAspect(state.templateId, state.aspectRatio)
      extractPaletteFromRegion(state.imageUrl!, 5, state.imageTransform, aspect)
        .then(setPalette)
        .catch(() => {})
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [state.imageTransform, state.imageUrl, state.isExtractingPalette, state.templateId, state.aspectRatio, setPalette])

  const handleSave = async () => {
    if (!state.imageUrl) return
    const scope = await Taro.getSetting()
    if (!scope.authSetting['scope.writePhotosAlbum']) {
      try {
        await Taro.authorize({ scope: 'scope.writePhotosAlbum' })
      } catch {
        Taro.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限以保存卡片',
          confirmText: '去设置',
          success: modalRes => {
            if (modalRes.confirm) Taro.openSetting()
          },
        })
        return
      }
    }
    setExportStatus('exporting')
    try {
      await exportAndSave({
        templateId: state.templateId,
        imageUrl: state.imageUrl,
        palette: state.palette,
        text: state.text,
        aspectRatio: state.aspectRatio,
        transform: state.imageTransform,
      })
      setExportStatus('success')
      Taro.showToast({ title: '已保存到相册', icon: 'success' })
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch {
      setExportStatus('error')
      Taro.showToast({ title: '保存失败，请重试', icon: 'error' })
    }
  }

  const CardComponent = {
    classic: ClassicCardPreview,
    music: VibeCardPreview,
    poster: PosterCardPreview,
  }[state.templateId]

  if (!state.imageUrl) {
    return (
      <View className="upload-page">
        <Text className="upload-title">🎨 PaletteCard</Text>
        <Text className="upload-desc">
          上传一张照片，提取主色调，生成好看的分享卡片
        </Text>
        <View className="upload-btn" onClick={handleChooseImage}>
          <Text className="upload-btn-text">选择照片</Text>
        </View>
        <Text className="upload-hint">
          🔒 照片仅在你的设备上处理，不上传服务器
        </Text>
      </View>
    )
  }

  return (
    <View className="editor-page">
      <View className="preview-area">
        {state.isExtractingPalette ? (
          <View className="extracting">
            <Text className="extracting-text">提取颜色中…</Text>
          </View>
        ) : (
          <View className="card-wrapper">
            <CardComponent
              imageUrl={state.imageUrl}
              palette={state.palette}
              text={state.text}
              aspectRatio={state.aspectRatio}
              transform={state.imageTransform}
              onTransformChange={setTransform}
            />
          </View>
        )}
      </View>

      <View className="toolbar">
        <View onClick={handleChooseImage} style={toolbarBtnStyle}>
          <Text style={{ fontSize: 22 }}>🖼️</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>换图</Text>
        </View>
        <View className="toolbar-divider" />
        <View onClick={() => setDrawerVisible(true)} style={toolbarBtnStyle}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>调整</Text>
        </View>
        <View className="toolbar-divider" />
        <View
          onClick={handleSave}
          style={{ ...toolbarBtnStyle, opacity: state.exportStatus === 'exporting' ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 22 }}>
            {state.exportStatus === 'exporting' ? '⏳' : '💾'}
          </Text>
          <Text style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>
            {state.exportStatus === 'exporting' ? '保存中…' : '保存'}
          </Text>
        </View>
      </View>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        state={{ templateId: state.templateId, aspectRatio: state.aspectRatio, text: state.text }}
        onTemplate={setTemplate}
        onAspectRatio={setAspectRatio}
        onText={setText}
      />
    </View>
  )
}
