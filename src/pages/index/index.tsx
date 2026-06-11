import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { useEditorState } from '../../hooks/useEditorState'
import { extractPaletteFromRegion } from '../../utils/extractPalette'
import { exportAndSave } from '../../utils/canvasExport'
import { getCardImageAspect } from '../../utils/templateConfig'
import { lightenColor } from '../../utils/colorUtils'
import { ClassicCardPreview } from '../../components/cards/ClassicCardPreview'
import { VibeCardPreview } from '../../components/cards/VibeCardPreview'
import { PosterCardPreview } from '../../components/cards/PosterCardPreview'
import { SettingsDrawer } from '../../components/editor/SettingsDrawer'
import { EditorHeader, useCardDimensions } from '../../components/editor/EditorHeader'
import './index.scss'

export default function Index() {
  const { state, setImage, setPalette, setTemplate, setAspectRatio, setText, setExportStatus, setTransform } = useEditorState()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const isChoosingRef = useRef(false)
  const extractSeqRef = useRef(0)
  const { cardWidth, cardHeight } = useCardDimensions(state.aspectRatio)

  const handleChooseImage = () => {
    if (isChoosingRef.current) return
    isChoosingRef.current = true

    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const file = res.tempFiles?.[0]
        if (!file?.tempFilePath) {
          Taro.showToast({ title: '未获取到图片', icon: 'none' })
          return
        }
        setImage(file.tempFilePath)
      },
      fail: err => {
        const cancelled = err?.errMsg?.includes('cancel')
        if (!cancelled) {
          Taro.showToast({ title: '选图失败，请重试', icon: 'none' })
        }
        console.warn('[chooseMedia] fail:', err)
      },
      complete: () => {
        isChoosingRef.current = false
      },
    })
  }

  // 初次选图后提取颜色
  useEffect(() => {
    if (!state.imageUrl || !state.isExtractingPalette) return

    const seq = ++extractSeqRef.current
    const aspect = getCardImageAspect(state.templateId, state.aspectRatio)

    extractPaletteFromRegion(state.imageUrl, 5, state.imageTransform, aspect)
      .then(palette => {
        if (seq !== extractSeqRef.current) return
        setPalette(palette)
      })
      .catch(() => {
        if (seq !== extractSeqRef.current) return
        setPalette([])
      })
  }, [state.imageUrl, state.isExtractingPalette, state.templateId, state.aspectRatio, setPalette])

  // 缩放/拖动后 debounce 重提取
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!state.imageUrl || state.isExtractingPalette) return

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const seq = ++extractSeqRef.current
      const aspect = getCardImageAspect(state.templateId, state.aspectRatio)
      extractPaletteFromRegion(state.imageUrl!, 5, state.imageTransform, aspect)
        .then(palette => {
          if (seq !== extractSeqRef.current) return
          setPalette(palette)
        })
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
        <View className="upload-header">
          <Text className="upload-title">🎨 PaletteCard</Text>
          <Text className="upload-desc">
            上传照片，提取主色调{'\n'}生成好看的分享卡片
          </Text>
        </View>

        <View className="upload-fab" onTap={handleChooseImage}>
          <Text className="upload-fab-icon">+</Text>
        </View>

        <Text className="upload-hint">
          🔒 照片仅在你的设备上处理，不上传服务器
        </Text>
      </View>
    )
  }

  const cardBgColor = state.palette[0]?.hex ?? '#8b9cb3'
  const pageBgColor = lightenColor(cardBgColor, 0.15)

  return (
    <View
      className="editor-page"
      style={{ backgroundColor: pageBgColor }}
    >
      <EditorHeader
        onChooseImage={handleChooseImage}
        onSave={handleSave}
        onSettings={() => setDrawerVisible(true)}
        isSaving={state.exportStatus === 'exporting'}
      />
      <View className="preview-area">
        {state.isExtractingPalette && (
          <View className="extracting-badge">
            <Text className="extracting-text">提取颜色中…</Text>
          </View>
        )}
        <View
          className="card-wrapper"
          style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
        >
          <CardComponent
            imageUrl={state.imageUrl}
            palette={state.palette}
            text={state.text}
            aspectRatio={state.aspectRatio}
            transform={state.imageTransform}
            onTransformChange={setTransform}
          />
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
