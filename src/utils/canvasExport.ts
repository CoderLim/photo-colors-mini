import Taro from '@tarojs/taro'
import { getContrastText } from './colorUtils'
import type { PaletteColor, TextContent, AspectRatio, TemplateId, ImageTransform } from '../types/editor'

const DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 1500, h: 1500 },
  '3:4': { w: 1500, h: 2000 },
  '9:16': { w: 1080, h: 1920 },
}

interface ExportOptions {
  templateId: TemplateId
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
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
  transform: ImageTransform
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

function canvasToTempFile(canvas: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas: canvas as never,
      success: res => resolve(res.tempFilePath),
      fail: reject,
    })
  })
}

function buildMetaLine(text: TextContent): string {
  return [text.location.trim(), text.date.trim()].filter(Boolean).join(' · ')
}

async function exportClassic(options: ExportOptions): Promise<string> {
  const { w, h } = DIMENSIONS[options.aspectRatio]
  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  const photoH = Math.round(h * 0.7)
  const infoH = h - photoH
  const bgColor = options.palette[0]?.hex ?? '#f5f5f5'
  const textColor = getContrastText(bgColor)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, photoH)
  ctx.clip()
  drawZoomedImage(ctx, img, 0, 0, w, photoH, options.transform)
  ctx.restore()

  ctx.fillStyle = bgColor
  ctx.fillRect(0, photoH, w, infoH)

  const px = 60
  let ty = photoH + 48
  ctx.fillStyle = textColor
  ctx.font = '700 48px Arial'
  ctx.fillText(options.text.title || 'My Photo', px, ty)
  ty += 60
  if (options.text.subtitle) {
    ctx.globalAlpha = 0.7
    ctx.font = '400 28px Arial'
    ctx.fillText(options.text.subtitle, px, ty)
    ty += 40
    ctx.globalAlpha = 1
  }

  const meta = buildMetaLine(options.text)
  if (meta) {
    ctx.globalAlpha = 0.5
    ctx.font = '400 22px Arial'
    ctx.fillText(meta, px, ty)
    ctx.globalAlpha = 1
  }

  if (options.palette.length > 0) {
    const swatchY = h - 48 - 34
    let sx = px
    options.palette.slice(0, 5).forEach(c => {
      ctx.fillStyle = c.hex
      ctx.beginPath()
      ctx.arc(sx + 17, swatchY + 17, 17, 0, Math.PI * 2)
      ctx.fill()
      sx += 17 * 2 + 18
    })
  }

  return canvasToTempFile(canvas)
}

async function exportPoster(options: ExportOptions): Promise<string> {
  const { w, h } = DIMENSIONS[options.aspectRatio]
  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  drawZoomedImage(ctx, img, 0, 0, w, h, options.transform)

  const grad = ctx.createLinearGradient(0, h, 0, 0)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0.1)')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const barH = 16
  if (options.palette.length > 0) {
    const bW = w / options.palette.length
    options.palette.forEach((c, i) => {
      ctx.fillStyle = c.hex
      ctx.fillRect(i * bW, h - barH, bW, barH)
    })
  }

  const textBottom = options.palette.length > 0 ? h - barH - 48 : h - 48
  const meta = buildMetaLine(options.text)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'

  let ty = textBottom
  if (meta) {
    ctx.globalAlpha = 0.6
    ctx.font = '400 28px Arial'
    ctx.fillText(meta, w - 60, ty)
    ty -= 44
    ctx.globalAlpha = 1
  }
  if (options.text.subtitle) {
    ctx.globalAlpha = 0.8
    ctx.font = '400 36px Arial'
    ctx.fillText(options.text.subtitle, w - 60, ty)
    ty -= 52
    ctx.globalAlpha = 1
  }
  ctx.font = '700 72px Arial'
  ctx.fillText(options.text.title || 'My Photo', w - 60, ty - 20)

  return canvasToTempFile(canvas)
}

async function exportVibe(options: ExportOptions): Promise<string> {
  const { w, h } = DIMENSIONS[options.aspectRatio]
  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  const dominantHex = options.palette[0]?.hex ?? '#1a1a2e'

  ctx.fillStyle = dominantHex
  ctx.fillRect(0, 0, w, h)

  ctx.globalAlpha = 0.7
  ctx.filter = 'blur(20px)'
  ctx.drawImage(img, -w * 0.1, -h * 0.1, w * 1.2, h * 1.2)
  ctx.filter = 'none'
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, w, h)

  const imgSize = Math.round(w * 0.8)
  const imgX = (w - imgSize) / 2
  const imgY = Math.round(h * 0.1)
  ctx.save()
  ctx.beginPath()
  ctx.rect(imgX, imgY, imgSize, imgSize)
  ctx.clip()
  drawZoomedImage(ctx, img, imgX, imgY, imgSize, imgSize, options.transform)
  ctx.restore()

  ctx.textAlign = 'center'
  let ty = imgY + imgSize + 60
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 52px Arial'
  ctx.fillText(options.text.title || 'My Photo', w / 2, ty)
  ty += 64
  if (options.text.subtitle) {
    ctx.globalAlpha = 0.8
    ctx.font = '400 32px Arial'
    ctx.fillText(options.text.subtitle, w / 2, ty)
    ty += 48
    ctx.globalAlpha = 1
  }

  const meta = buildMetaLine(options.text)
  if (meta) {
    ctx.globalAlpha = 0.6
    ctx.font = '400 28px Arial'
    ctx.fillText(meta, w / 2, ty)
    ty += 48
    ctx.globalAlpha = 1
  }

  if (options.palette.length > 0) {
    let sx = (w - (options.palette.length * 52 - 16)) / 2
    options.palette.slice(0, 5).forEach(c => {
      ctx.fillStyle = c.hex
      ctx.beginPath()
      ctx.arc(sx + 18, ty + 18, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
      sx += 52
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
