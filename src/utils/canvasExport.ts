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

function formatDisplayTime(dateStr: string): string {
  const d = dateStr ? new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function buildLocationLine(text: TextContent): string {
  const location = text.location.trim()
  if (location) return location
  return [text.title, text.subtitle].filter(v => v.trim()).join(' • ')
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

async function exportUnified(options: ExportOptions): Promise<string> {
  const { w, h } = DIMENSIONS[options.aspectRatio]
  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: w, height: h })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const img = await loadImage(canvas, options.imageUrl)

  const metaH = Math.round(h * 0.5)
  const photoH = h - metaH
  const bgColor = options.palette[0]?.hex ?? '#8b9cb3'
  const textColor = getContrastText(bgColor)
  const cornerRadius = Math.round(w * 0.026)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  drawRoundedRect(ctx, 0, 0, w, h, cornerRadius)
  ctx.clip()

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, metaH)

  const locationLine = buildLocationLine(options.text)
  const timeLine = formatDisplayTime(options.text.date)

  ctx.textAlign = 'center'
  ctx.fillStyle = textColor

  if (locationLine) {
    ctx.font = '600 36px Arial'
    ctx.fillText(locationLine.toUpperCase(), w / 2, metaH / 2 - (timeLine ? 24 : 0))
  }
  if (timeLine) {
    ctx.globalAlpha = 0.85
    ctx.font = '400 32px Arial'
    ctx.fillText(timeLine, w / 2, metaH / 2 + (locationLine ? 36 : 0))
    ctx.globalAlpha = 1
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, metaH, w, photoH)
  ctx.clip()
  drawZoomedImage(ctx, img, 0, metaH, w, photoH, options.transform)
  ctx.restore()

  if (options.templateId === 'poster' && options.palette.length > 0) {
    const barH = 16
    const bW = w / options.palette.length
    options.palette.forEach((c, i) => {
      ctx.fillStyle = c.hex
      ctx.fillRect(i * bW, metaH + photoH - barH, bW, barH)
    })
  }

  ctx.restore()

  return canvasToTempFile(canvas)
}

/**
 * 根据模板导出卡片并保存到相册
 */
export async function exportAndSave(options: ExportOptions): Promise<void> {
  const tempFilePath = await exportUnified(options)
  await Taro.saveImageToPhotosAlbum({ filePath: tempFilePath })
}
