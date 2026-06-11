import type { TemplateId, AspectRatio } from '../types/editor'

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1500, height: 1500 },
  '3:4': { width: 1500, height: 2000 },
  '9:16': { width: 1080, height: 1920 },
}

/**
 * 返回各模板中图片区域的宽高比（用于颜色提取时的 canvas 裁剪）
 * 统一布局：metadata 占上半 ~50%，照片占下半 ~50%
 */
export function getCardImageAspect(_templateId: TemplateId, aspectRatio: AspectRatio): number {
  const { width, height } = ASPECT_RATIO_DIMENSIONS[aspectRatio]
  const cardAspect = width / height
  return cardAspect / 0.5
}
