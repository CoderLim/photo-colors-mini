import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'
import type { AspectRatio } from '../../types/editor'

const CARD_HORIZONTAL_PADDING = 48 // 左右各 24px

const ASPECT_HEIGHT_RATIO: Record<AspectRatio, number> = {
  '1:1': 1,
  '3:4': 4 / 3,
  '9:16': 16 / 9,
}

interface Props {
  onChooseImage: () => void
  onSave: () => void
  onSettings: () => void
  isSaving?: boolean
}

export function useEditorLayout() {
  return useMemo(() => {
    const win = Taro.getWindowInfo()
    const menu = Taro.getMenuButtonBoundingClientRect()
    const statusBarHeight = win.statusBarHeight ?? 44
    const headerTop = menu.top || statusBarHeight
    const headerPaddingRight = Math.max(20, win.windowWidth - menu.left + 8)

    return { headerTop, headerPaddingRight }
  }, [])
}

export function useCardDimensions(aspectRatio: AspectRatio) {
  return useMemo(() => {
    const win = Taro.getWindowInfo()
    const cardWidth = win.windowWidth - CARD_HORIZONTAL_PADDING
    const cardHeight = Math.round(cardWidth * ASPECT_HEIGHT_RATIO[aspectRatio])
    return { cardWidth, cardHeight }
  }, [aspectRatio])
}

export function EditorHeader({ onChooseImage, onSave, onSettings, isSaving }: Props) {
  const { headerTop, headerPaddingRight } = useEditorLayout()

  return (
    <View
      className="editor-header"
      style={{
        paddingTop: `${headerTop}px`,
        paddingRight: `${headerPaddingRight}px`,
      }}
    >
      <Text className="editor-header-title">PhotoColors</Text>
      <View className="editor-header-actions">
        <View className="editor-header-btn" onTap={onChooseImage}>
          <Text className="editor-header-btn-icon">+</Text>
        </View>
        <View
          className="editor-header-btn"
          onTap={isSaving ? undefined : onSave}
          style={{ opacity: isSaving ? 0.4 : 1 }}
        >
          <Text className="editor-header-btn-icon">↓</Text>
        </View>
        <View className="editor-header-btn" onTap={onSettings}>
          <Text className="editor-header-btn-icon editor-header-btn-icon--sm">⚙</Text>
        </View>
      </View>
    </View>
  )
}
