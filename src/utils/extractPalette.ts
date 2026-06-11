import Taro from '@tarojs/taro'
import type { PaletteColor, ImageTransform } from '../types/editor'
import { rgbToHex, rgbToHsl, isBoringColor } from './colorUtils'

function medianCut(pixels: Uint8ClampedArray, count: number): Array<[number, number, number]> {
  const samples: Array<[number, number, number]> = []
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3]
    if (a < 125) continue
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]]
    if (!isBoringColor(r, g, b)) samples.push([r, g, b])
  }
  if (samples.length === 0) return [[128, 128, 128]]

  function split(bucket: Array<[number, number, number]>, depth: number): Array<[number, number, number]> {
    if (depth === 0 || bucket.length < 10) {
      const avg = bucket.reduce((acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b], [0, 0, 0])
        .map(v => Math.round(v / bucket.length)) as [number, number, number]
      return [avg]
    }
    let [minR, minG, minB] = [255, 255, 255]
    let [maxR, maxG, maxB] = [0, 0, 0]
    for (const [r, g, b] of bucket) {
      if (r < minR) minR = r; if (r > maxR) maxR = r
      if (g < minG) minG = g; if (g > maxG) maxG = g
      if (b < minB) minB = b; if (b > maxB) maxB = b
    }
    const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB
    const sortIdx = rangeR >= rangeG && rangeR >= rangeB ? 0 : rangeG >= rangeB ? 1 : 2
    bucket.sort((a, b) => a[sortIdx] - b[sortIdx])
    const mid = Math.floor(bucket.length / 2)
    return [...split(bucket.slice(0, mid), depth - 1), ...split(bucket.slice(mid), depth - 1)]
  }

  const depth = Math.ceil(Math.log2(count))
  const colors = split(samples, depth)
  const seen = new Set<string>()
  return colors.filter(([r, g, b]) => {
    const hex = rgbToHex(r, g, b)
    if (seen.has(hex)) return false
    seen.add(hex)
    return true
  }).slice(0, count)
}

/**
 * 从图片路径提取调色板（可指定 transform 只提取可见区域）
 */
export async function extractPaletteFromRegion(
  imagePath: string,
  count: number,
  transform: ImageTransform,
  containerAspect: number,
): Promise<PaletteColor[]> {
  return new Promise((resolve, reject) => {
    const W = 300
    const H = Math.max(1, Math.round(W / containerAspect))

    const canvas = Taro.createOffscreenCanvas({ type: '2d', width: W, height: H })
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const img = (canvas as unknown as { createImage: () => HTMLImageElement }).createImage()

    img.onload = () => {
      try {
        const { scale, x, y } = transform
        const imgAspect = img.width / img.height

        let drawX: number, drawY: number, drawW: number, drawH: number
        if (imgAspect > containerAspect) {
          drawH = H; drawW = H * imgAspect
          drawX = (W - drawW) / 2; drawY = 0
        } else {
          drawW = W; drawH = W / imgAspect
          drawX = 0; drawY = (H - drawH) / 2
        }

        const cx = W / 2, cy = H / 2
        ctx.save()
        ctx.translate(cx + x, cy + y)
        ctx.scale(scale, scale)
        ctx.translate(-cx, -cy)
        ctx.drawImage(img, drawX, drawY, drawW, drawH)
        ctx.restore()

        const { data } = ctx.getImageData(0, 0, W, H)
        const rawColors = medianCut(data as unknown as Uint8ClampedArray, count)
        const palette: PaletteColor[] = rawColors.map(([r, g, b], i) => ({
          hex: rgbToHex(r, g, b),
          rgb: [r, g, b],
          hsl: rgbToHsl(r, g, b),
          population: count - i,
        }))
        resolve(palette)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imagePath
  })
}
