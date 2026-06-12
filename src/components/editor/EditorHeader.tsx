import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'
import type { AspectRatio } from '../../types/editor'

import { CARD_HORIZONTAL_PADDING } from '../../utils/cardLayout'

const ASPECT_HEIGHT_RATIO: Record<AspectRatio, number> = {
  '1:1': 1,
  '3:4': 4 / 3,
  '9:16': 16 / 9,
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

export function EditorHeader() {
  const { headerTop, headerPaddingRight } = useEditorLayout()

  return (
    <View
      className="editor-header"
      style={{
        paddingTop: `${headerTop}px`,
        paddingRight: `${headerPaddingRight}px`,
      }}
    >
      <Text className="editor-header-title">ColorWalk</Text>
    </View>
  )
}

interface ToolbarProps {
  onChooseImage: () => void
  onSave: () => void
  onSettings: () => void
  isSaving?: boolean
}

export function EditorToolbar({ onChooseImage, onSave, onSettings, isSaving }: ToolbarProps) {
  return (
    <View className="editor-toolbar">
      <View className="editor-toolbar-actions">
        <View className="editor-toolbar-btn" onTap={onChooseImage}>
          <Text className="editor-toolbar-btn-icon">+</Text>
        </View>
        <View
          className="editor-toolbar-btn"
          onTap={isSaving ? undefined : onSave}
          style={{ opacity: isSaving ? 0.4 : 1 }}
        >
          <Text className="editor-toolbar-btn-icon">↓</Text>
        </View>
        <View className="editor-toolbar-btn" onTap={onSettings}>
          <Text className="editor-toolbar-btn-icon editor-toolbar-btn-icon--sm">⚙</Text>
        </View>
      </View>
    </View>
  )
}
