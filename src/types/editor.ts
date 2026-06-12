export type TemplateId = 'classic' | 'music' | 'poster'
export type AspectRatio = '1:1' | '3:4' | '9:16'

export interface PaletteColor {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  population: number
}

export interface TextContent {
  title: string
  subtitle: string
  location: string
  date: string
}

export interface ImageTransform {
  scale: number // [1, 5]，默认 1.2
  x: number // 水平偏移，0 = 居中
  y: number // 垂直偏移，0 = 居中
}

export const DEFAULT_TRANSFORM: ImageTransform = { scale: 1.2, x: 0, y: 0 }

export type ExportStatus = 'idle' | 'exporting' | 'success' | 'error'

export interface EditorState {
  imageUrl: string | null // wx.chooseMedia 返回的 tempFilePath
  palette: PaletteColor[]
  templateId: TemplateId
  aspectRatio: AspectRatio
  text: TextContent
  exportStatus: ExportStatus
  isExtractingPalette: boolean
  imageTransform: ImageTransform
}

export type EditorAction =
  | { type: 'SET_IMAGE'; url: string }
  | { type: 'SET_PALETTE'; palette: PaletteColor[] }
  | { type: 'SET_TEMPLATE'; templateId: TemplateId }
  | { type: 'SET_ASPECT_RATIO'; aspectRatio: AspectRatio }
  | { type: 'SET_TEXT'; field: keyof TextContent; value: string }
  | { type: 'SET_EXPORT_STATUS'; status: ExportStatus }
  | { type: 'SET_EXTRACTING'; isExtracting: boolean }
  | { type: 'SET_TRANSFORM'; transform: ImageTransform }
  | { type: 'RESET_TRANSFORM' }
  | { type: 'RESET' }
