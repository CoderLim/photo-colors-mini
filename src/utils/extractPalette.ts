import Taro from '@tarojs/taro'
import type { PaletteColor, ImageTransform } from '../types/editor'
import { rgbToHex, rgbToHsl, isBoringColor } from './colorUtils'

const EXTRACT_TIMEOUT_MS = 8000

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

/** 提取失败时的兜底色板，避免界面卡在 loading */
function fallbackPalette(count: number): PaletteColor[] {
  const hexes = ['#3d3d3d', '#6b6b6b', '#9a9a9a', '#c8c8c8', '#f0f0f0']
  return hexes.slice(0, count).map((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return {
      hex,
      rgb: [r, g, b] as [number, number, number],
      hsl: rgbToHsl(r, g, b),
      population: count - i,
    }
  })
}

function toPalette(rawColors: Array<[number, number, number]>, count: number): PaletteColor[] {
  return rawColors.map(([r, g, b], i) => ({
    hex: rgbToHex(r, g, b),
    rgb: [r, g, b],
    hsl: rgbToHsl(r, g, b),
    population: count - i,
  }))
}

type OffscreenCanvasLike = {
  getContext: (type: '2d') => CanvasRenderingContext2D | null
  createImage: () => {
    onload: (() => void) | null
    onerror: ((err?: unknown) => void) | null
    src: string
    width: number
    height: number
  }
}

function drawAndSample(
  ctx: CanvasRenderingContext2D,
  img: { width: number; height: number },
  W: number,
  H: number,
  transform: ImageTransform,
  containerAspect: number,
  count: number,
): PaletteColor[] {
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
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(cx + x, cy + y)
  ctx.scale(scale, scale)
  ctx.translate(-cx, -cy)
  ctx.drawImage(img as unknown as CanvasImageSource, drawX, drawY, drawW, drawH)
  ctx.restore()

  const { data } = ctx.getImageData(0, 0, W, H)
  return toPalette(medianCut(data, count), count)
}

function loadImageOnCanvas(canvas: OffscreenCanvasLike, src: string): Promise<OffscreenCanvasLike['createImage']> {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    const timer = setTimeout(() => {
      img.onload = null
      img.onerror = null
      reject(new Error('image load timeout'))
    }, EXTRACT_TIMEOUT_MS)

    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = err => {
      clearTimeout(timer)
      reject(err ?? new Error('Failed to load image'))
    }
    // 须用小写 onload；getImageInfo 返回的 path 在真机上更稳定
    img.src = src
  })
}

async function extractWithOffscreenCanvas(
  imagePath: string,
  count: number,
  transform: ImageTransform,
  containerAspect: number,
): Promise<PaletteColor[]> {
  const W = 300
  const H = Math.max(1, Math.round(W / containerAspect))

  if (typeof Taro.createOffscreenCanvas !== 'function') {
    throw new Error('createOffscreenCanvas not supported')
  }

  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: W, height: H }) as unknown as OffscreenCanvasLike
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const img = await loadImageOnCanvas(canvas, imagePath)
  return drawAndSample(ctx, img, W, H, transform, containerAspect, count)
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
  try {
    const info = await Taro.getImageInfo({ src: imagePath })
    const stablePath = info.path || imagePath

    return await Promise.race([
      extractWithOffscreenCanvas(stablePath, count, transform, containerAspect),
      new Promise<PaletteColor[]>((_, reject) => {
        setTimeout(() => reject(new Error('extract timeout')), EXTRACT_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    console.warn('[extractPalette] fallback palette used:', err)
    return fallbackPalette(count)
  }
}
