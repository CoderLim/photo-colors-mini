import { CardLayoutShell } from './CardLayoutShell'
import type { PaletteColor, TextContent, AspectRatio, ImageTransform } from '../../types/editor'

interface Props {
  imageUrl: string
  palette: PaletteColor[]
  text: TextContent
  aspectRatio: AspectRatio
  transform: ImageTransform
  onTransformChange?: (t: ImageTransform) => void
}

export function VibeCardPreview(props: Props) {
  return <CardLayoutShell {...props} variant="music" />
}
