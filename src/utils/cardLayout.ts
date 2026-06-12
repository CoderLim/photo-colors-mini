import Taro from '@tarojs/taro'
import type { AspectRatio, ImageTransform } from '../types/editor'

export const CARD_HORIZONTAL_PADDING = 48
/** Taro pxtransform 设计稿宽度，SCSS 中 px 会先转为 rpx 再渲染 */
export const DESIGN_WIDTH = 750

export const EXPORT_DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1500, h: 1500 },
  '3:4': { w: 1500, h: 2000 },
  '9:16': { w: 1080, h: 1920 },
}

export const PREVIEW_LAYOUT = {
  classic: {
    metaRatio: 0.5,
    cornerRadius: 32,
    primaryFontSize: 22,
    secondaryFontSize: 26,
    letterSpacingPrimary: 4,
    metaGap: 16,
    defaultBg: '#8b9cb3',
  },
  vibe: {
    cornerRadius: 32,
    paddingY: 48,
    paddingX: 64,
    contentGap: 32,
    textGap: 8,
    metaMarginTop: 4,
    photoWidthRatio: 0.8,
    photoRadius: 24,
    photoBorder: 3,
    photoShadowBlur: 48,
    photoShadowOffsetY: 16,
    photoShadowAlpha: 0.35,
    blurScale: 1.25,
    blurOpacity: 0.75,
    blurPx: 30,
    titleFontSize: 40,
    subtitleFontSize: 26,
    metaFontSize: 22,
    swatchSize: 32,
    swatchGap: 8,
    defaultBg: '#1a1a2e',
  },
  poster: {
    cornerRadius: 32,
    barHeight: 10,
    textBottom: 64,
    textRight: 40,
    textGap: 12,
    titleFontSize: 48,
    subtitleFontSize: 26,
    metaFontSize: 22,
  },
} as const

export function getPreviewCardWidth(windowWidth: number): number {
  return windowWidth - CARD_HORIZONTAL_PADDING
}

/** 预览卡片宽度（物理像素）→ 导出画布宽度的缩放比，用于拖拽位移等物理像素量 */
export function getPhysicalScale(exportWidth: number, previewWidth: number): number {
  return exportWidth / previewWidth
}

/**
 * SCSS 标注的 px 经 pxtransform 转为 rpx 后实际渲染为 designPx * (windowWidth / DESIGN_WIDTH)。
 * 导出时需用此比例，才能让字号/间距与预览视觉一致。
 */
export function getLayoutScale(
  exportWidth: number,
  previewWidth: number,
  windowWidth?: number,
): number {
  const win = windowWidth ?? Taro.getWindowInfo().windowWidth
  return getPhysicalScale(exportWidth, previewWidth) * (win / DESIGN_WIDTH)
}

export function scaleTransform(transform: ImageTransform, physicalScale: number): ImageTransform {
  return {
    scale: transform.scale,
    x: transform.x * physicalScale,
    y: transform.y * physicalScale,
  }
}

export function scaleLayoutPx(designPx: number, layoutScale: number): number {
  return Math.round(designPx * layoutScale)
}
