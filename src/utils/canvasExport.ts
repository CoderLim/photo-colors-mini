import Taro from '@tarojs/taro'
import { getContrastText } from './colorUtils'
import { buildLocationLine, buildMetaLine, formatDisplayTime } from './cardText'
import {
  EXPORT_DIMENSIONS,
  PREVIEW_LAYOUT,
  getLayoutScale,
  getPhysicalScale,
  getPreviewCardWidth,
  scaleLayoutPx,
  scaleTransform,
} from './cardLayout'
import type { PaletteColor, TextContent, AspectRatio, TemplateId, ImageTransform } from '../types/editor'

interface ExportOptions {
  templateId: TemplateId
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
  previewWidth?: number
}

function loadImage(canvas: unknown, src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = (canvas as { createImage: () => HTMLImageElement }).createImage()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawZoomedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, W: number, H: number,
  transform: ImageTransform,
) {
  const imgAspect = img.width / img.height
  const containerAspect = W / H
  let drawX: number, drawY: number, drawW: number, drawH: number
  if (imgAspect > containerAspect) {
    drawH = H; drawW = H * imgAspect; drawX = x + (W - drawW) / 2; drawY = y
  } else {
    drawW = W; drawH = W / imgAspect; drawX = x; drawY = y + (H - drawH) / 2
  }
  const cx = x + W / 2, cy = y + H / 2
  ctx.save()
  ctx.translate(cx + transform.x, cy + transform.y)
  ctx.scale(transform.scale, transform.scale)
  ctx.translate(-cx, -cy)
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.restore()
}

function drawLetterSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  letterSpacing: number,
) {
  const chars = text.toUpperCase().split('')
  const widths = chars.map(c => ctx.measureText(c).width)
  const totalWidth = widths.reduce((sum, w) => sum + w, 0) + letterSpacing * Math.max(0, chars.length - 1)
  let x = centerX - totalWidth / 2
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y)
    x += widths[i] + letterSpacing
  }
}

function measureTextBlockHeight(
  ctx: CanvasRenderingContext2D,
  text: TextContent,
  layoutScale: number,
  layout: typeof PREVIEW_LAYOUT.vibe,
): number {
  const textGap = scaleLayoutPx(layout.textGap, layoutScale)
  const metaMargin = scaleLayoutPx(layout.metaMarginTop, layoutScale)
  let height = 0

  ctx.font = `700 ${scaleLayoutPx(layout.titleFontSize, layoutScale)}px Arial`
  height += scaleLayoutPx(layout.titleFontSize, layoutScale) * 1.2

  if (text.subtitle) {
    height += textGap
    height += scaleLayoutPx(layout.subtitleFontSize, layoutScale) * 1.2
  }

  const meta = buildMetaLine(text)
  if (meta) {
    height += metaMargin + scaleLayoutPx(layout.metaFontSize, layoutScale) * 1.2
  }

  return height
}

function canvasToTempFile(canvas: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas: canvas as never,
      success: res => resolve(res.tempFilePath),
      fail: reject,
    })
  })
}

function resolvePreviewWidth(previewWidth?: number): number {
  if (previewWidth && previewWidth > 0) return previewWidth
  return getPreviewCardWidth(Taro.getWindowInfo().windowWidth)
}

async function exportClassic(options: ExportOptions): Promise<string> {
  const { w, h } = EXPORT_DIMENSIONS[options.aspectRatio]
  const layout = PREVIEW_LAYOUT.classic
  const previewWidth = resolvePreviewWidth(options.previewWidth)
  const physicalScale = getPhysicalScale(w, previewWidth)
  const layoutScale = getLayoutScale(w, previewWidth)
  const transform = scaleTransform(options.transform, physicalScale)

  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  const metaH = Math.round(h * layout.metaRatio)
  const photoH = h - metaH
  const bgColor = options.palette[0]?.hex ?? layout.defaultBg
  const textColor = getContrastText(bgColor)

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, metaH)

  const locationLine = buildLocationLine(options.text)
  const timeLine = formatDisplayTime(options.text.date)
  const metaGap = scaleLayoutPx(layout.metaGap, layoutScale)
  const primarySize = scaleLayoutPx(layout.primaryFontSize, layoutScale)
  const secondarySize = scaleLayoutPx(layout.secondaryFontSize, layoutScale)
  const letterSpacing = scaleLayoutPx(layout.letterSpacingPrimary, layoutScale)

  ctx.textAlign = 'left'
  ctx.fillStyle = textColor

  if (locationLine && timeLine) {
    const blockH = primarySize * 1.4 + metaGap + secondarySize * 1.2
    const startY = (metaH - blockH) / 2
    ctx.font = `600 ${primarySize}px Arial`
    drawLetterSpacedText(ctx, locationLine, w / 2, startY + primarySize, letterSpacing)
    ctx.globalAlpha = 0.85
    ctx.font = `400 ${secondarySize}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(timeLine, w / 2, startY + primarySize * 1.4 + metaGap + secondarySize)
    ctx.globalAlpha = 1
  } else if (locationLine) {
    ctx.font = `600 ${primarySize}px Arial`
    drawLetterSpacedText(ctx, locationLine, w / 2, metaH / 2 + primarySize * 0.35, letterSpacing)
  } else if (timeLine) {
    ctx.globalAlpha = 0.85
    ctx.font = `400 ${secondarySize}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(timeLine, w / 2, metaH / 2 + secondarySize * 0.35)
    ctx.globalAlpha = 1
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, metaH, w, photoH)
  ctx.clip()
  drawZoomedImage(ctx, img, 0, metaH, w, photoH, transform)
  ctx.restore()

  return canvasToTempFile(canvas)
}

async function exportPoster(options: ExportOptions): Promise<string> {
  const { w, h } = EXPORT_DIMENSIONS[options.aspectRatio]
  const layout = PREVIEW_LAYOUT.poster
  const previewWidth = resolvePreviewWidth(options.previewWidth)
  const physicalScale = getPhysicalScale(w, previewWidth)
  const layoutScale = getLayoutScale(w, previewWidth)
  const transform = scaleTransform(options.transform, physicalScale)

  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  drawZoomedImage(ctx, img, 0, 0, w, h, transform)

  const grad = ctx.createLinearGradient(0, h, 0, 0)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0.1)')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const barH = scaleLayoutPx(layout.barHeight, layoutScale)
  if (options.palette.length > 0) {
    const bW = w / options.palette.length
    options.palette.forEach((c, i) => {
      ctx.fillStyle = c.hex
      ctx.fillRect(i * bW, h - barH, bW, barH)
    })
  }

  const textRight = scaleLayoutPx(layout.textRight, layoutScale)
  const textGap = scaleLayoutPx(layout.textGap, layoutScale)
  const titleSize = scaleLayoutPx(layout.titleFontSize, layoutScale)
  const subtitleSize = scaleLayoutPx(layout.subtitleFontSize, layoutScale)
  const metaSize = scaleLayoutPx(layout.metaFontSize, layoutScale)
  const textBottom = options.palette.length > 0
    ? h - barH - scaleLayoutPx(layout.textBottom, layoutScale)
    : h - scaleLayoutPx(layout.textBottom, layoutScale)

  const meta = buildMetaLine(options.text)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'

  let ty = textBottom
  if (meta) {
    ctx.globalAlpha = 0.6
    ctx.font = `400 ${metaSize}px Arial`
    ctx.fillText(meta, w - textRight, ty)
    ty -= metaSize * 1.2 + textGap
    ctx.globalAlpha = 1
  }
  if (options.text.subtitle) {
    ctx.globalAlpha = 0.8
    ctx.font = `400 ${subtitleSize}px Arial`
    ctx.fillText(options.text.subtitle, w - textRight, ty)
    ty -= subtitleSize * 1.2 + textGap
    ctx.globalAlpha = 1
  }
  ctx.font = `700 ${titleSize}px Arial`
  ctx.fillText(options.text.title || 'My Photo', w - textRight, ty)

  return canvasToTempFile(canvas)
}

async function exportVibe(options: ExportOptions): Promise<string> {
  const { w, h } = EXPORT_DIMENSIONS[options.aspectRatio]
  const layout = PREVIEW_LAYOUT.vibe
  const previewWidth = resolvePreviewWidth(options.previewWidth)
  const physicalScale = getPhysicalScale(w, previewWidth)
  const layoutScale = getLayoutScale(w, previewWidth)
  const transform = scaleTransform(options.transform, physicalScale)

  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  const dominantHex = options.palette[0]?.hex ?? layout.defaultBg
  const padX = scaleLayoutPx(layout.paddingX, layoutScale)
  const contentGap = scaleLayoutPx(layout.contentGap, layoutScale)
  const innerW = w - padX * 2
  const imgSize = Math.round(innerW * layout.photoWidthRatio)
  const photoBorder = scaleLayoutPx(layout.photoBorder, layoutScale)
  const swatchSize = scaleLayoutPx(layout.swatchSize, layoutScale)
  const swatchGap = scaleLayoutPx(layout.swatchGap, layoutScale)

  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, w, h)

  const blurOffset = (layout.blurScale - 1) / 2
  ctx.globalAlpha = layout.blurOpacity
  ctx.filter = `blur(${scaleLayoutPx(layout.blurPx, layoutScale)}px)`
  ctx.drawImage(
    img,
    -w * blurOffset,
    -h * blurOffset,
    w * layout.blurScale,
    h * layout.blurScale,
  )
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, w, h)

  const textBlockH = measureTextBlockHeight(ctx, options.text, layoutScale, layout)
  const swatchH = options.palette.length > 0 ? swatchSize : 0
  const contentH = imgSize + contentGap + textBlockH + (swatchH ? contentGap + swatchH : 0)
  const contentTop = Math.round((h - contentH) / 2)
  const imgX = Math.round((w - imgSize) / 2)
  const imgY = contentTop

  ctx.save()
  ctx.shadowColor = `rgba(0, 0, 0, ${layout.photoShadowAlpha})`
  ctx.shadowBlur = scaleLayoutPx(layout.photoShadowBlur, layoutScale)
  ctx.shadowOffsetY = scaleLayoutPx(layout.photoShadowOffsetY, layoutScale)
  ctx.fillStyle = 'rgba(0,0,0,0.01)'
  ctx.fillRect(imgX, imgY, imgSize, imgSize)
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.rect(imgX, imgY, imgSize, imgSize)
  ctx.clip()
  drawZoomedImage(ctx, img, imgX, imgY, imgSize, imgSize, transform)
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = photoBorder
  ctx.strokeRect(imgX, imgY, imgSize, imgSize)

  ctx.textAlign = 'center'
  let ty = imgY + imgSize + contentGap
  const titleSize = scaleLayoutPx(layout.titleFontSize, layoutScale)
  const subtitleSize = scaleLayoutPx(layout.subtitleFontSize, layoutScale)
  const metaSize = scaleLayoutPx(layout.metaFontSize, layoutScale)
  const textGap = scaleLayoutPx(layout.textGap, layoutScale)
  const metaMargin = scaleLayoutPx(layout.metaMarginTop, layoutScale)

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${titleSize}px Arial`
  ctx.fillText(options.text.title || 'My Photo', w / 2, ty + titleSize)
  ty += titleSize * 1.2

  if (options.text.subtitle) {
    ctx.globalAlpha = 0.8
    ctx.font = `400 ${subtitleSize}px Arial`
    ctx.fillText(options.text.subtitle, w / 2, ty + subtitleSize)
    ty += subtitleSize * 1.2 + textGap
    ctx.globalAlpha = 1
  }

  const meta = buildMetaLine(options.text)
  if (meta) {
    ty += metaMargin
    ctx.globalAlpha = 0.6
    ctx.font = `400 ${metaSize}px Arial`
    ctx.fillText(meta, w / 2, ty + metaSize)
    ty += metaSize * 1.2
    ctx.globalAlpha = 1
  }

  if (options.palette.length > 0) {
    ty += contentGap
    const swatchCount = Math.min(options.palette.length, 5)
    const rowW = swatchCount * swatchSize + (swatchCount - 1) * swatchGap
    let sx = (w - rowW) / 2 + swatchSize / 2
    const cy = ty + swatchSize / 2
    options.palette.slice(0, 5).forEach(c => {
      ctx.fillStyle = c.hex
      ctx.beginPath()
      ctx.arc(sx, cy, swatchSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = Math.max(1, scaleLayoutPx(1.5, layoutScale))
      ctx.stroke()
      sx += swatchSize + swatchGap
    })
  }

  return canvasToTempFile(canvas)
}

/**
 * 根据模板导出卡片并保存到相册
 */
export async function exportAndSave(options: ExportOptions): Promise<void> {
  let tempFilePath: string
  if (options.templateId === 'classic') {
    tempFilePath = await exportClassic(options)
  } else if (options.templateId === 'poster') {
    tempFilePath = await exportPoster(options)
  } else {
    tempFilePath = await exportVibe(options)
  }

  await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
}
