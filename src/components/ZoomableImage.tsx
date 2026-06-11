import { View, Image } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import { useRef, useCallback, useEffect } from 'react'
import type { ImageTransform } from '../types/editor'

interface ZoomableImageProps {
  src: string
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
  style?: React.CSSProperties
}

const MIN_SCALE = 1
const MAX_SCALE = 5

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function maxOffset(containerSize: number, scale: number) {
  return (containerSize / 2) * (scale - 1)
}

export function ZoomableImage({ src, transform, onTransformChange, style }: ZoomableImageProps) {
  const interactive = !!onTransformChange
  const transformRef = useRef(transform)
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null)

  useEffect(() => { transformRef.current = transform }, [transform])

  const applyTransform = useCallback((t: ImageTransform) => {
    // 小程序 view 没有 offsetWidth，用固定约束值（卡片宽度约 350）
    const W = 350, H = 620
    const mx = maxOffset(W, t.scale)
    const my = maxOffset(H, t.scale)
    const clamped: ImageTransform = {
      scale: t.scale,
      x: clamp(t.x, -mx, mx),
      y: clamp(t.y, -my, my),
    }
    transformRef.current = clamped
    onTransformChange?.(clamped)
  }, [onTransformChange])

  const onTouchStart = useCallback((e: ITouchEvent) => {
    if (!interactive) return
    if (e.touches.length === 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
      }
      pinchRef.current = null
    } else if (e.touches.length === 2) {
      dragRef.current = null
      const t0 = e.touches[0], t1 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
      pinchRef.current = { startDist: dist, startScale: transformRef.current.scale }
    }
  }, [interactive])

  const onTouchMove = useCallback((e: ITouchEvent) => {
    if (!interactive) return
    if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.startX
      const dy = e.touches[0].clientY - dragRef.current.startY
      applyTransform({ ...transformRef.current, x: dragRef.current.tx + dx, y: dragRef.current.ty + dy })
    } else if (e.touches.length === 2 && pinchRef.current) {
      const t0 = e.touches[0], t1 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
      const newScale = clamp(pinchRef.current.startScale * (dist / pinchRef.current.startDist), MIN_SCALE, MAX_SCALE)
      applyTransform({ ...transformRef.current, scale: newScale })
    }
  }, [interactive, applyTransform])

  const onTouchEnd = useCallback(() => {
    dragRef.current = null
    pinchRef.current = null
  }, [])

  const { scale, x, y } = transform
  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: 'center center',
  }

  return (
    <View
      style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', ...style }}
      onTouchStart={interactive ? onTouchStart : undefined}
      onTouchMove={interactive ? onTouchMove : undefined}
      onTouchEnd={interactive ? onTouchEnd : undefined}
      catchMove={interactive}
    >
      <Image src={src} style={imgStyle} mode="aspectFill" />
    </View>
  )
}
