import { useReducer, useCallback } from 'react'
import type {
  EditorState,
  EditorAction,
  TextContent,
  ImageTransform,
} from '../types/editor'
import { DEFAULT_TRANSFORM } from '../types/editor'

const initialState: EditorState = {
  imageUrl: null,
  palette: [],
  templateId: 'classic',
  aspectRatio: '9:16',
  text: {
    title: 'My Photo',
    subtitle: 'A moment in time',
    location: '',
    date: new Date().toISOString().split('T')[0],
  },
  exportStatus: 'idle',
  isExtractingPalette: false,
  imageTransform: DEFAULT_TRANSFORM,
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_IMAGE':
      return {
        ...state,
        imageUrl: action.url,
        palette: [],
        isExtractingPalette: true,
        imageTransform: DEFAULT_TRANSFORM,
      }
    case 'SET_PALETTE':
      return { ...state, palette: action.palette, isExtractingPalette: false }
    case 'SET_TEMPLATE':
      return { ...state, templateId: action.templateId }
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatio: action.aspectRatio }
    case 'SET_TEXT':
      return { ...state, text: { ...state.text, [action.field]: action.value } }
    case 'SET_EXPORT_STATUS':
      return { ...state, exportStatus: action.status }
    case 'SET_EXTRACTING':
      return { ...state, isExtractingPalette: action.isExtracting }
    case 'SET_TRANSFORM':
      return { ...state, imageTransform: action.transform }
    case 'RESET_TRANSFORM':
      return { ...state, imageTransform: DEFAULT_TRANSFORM }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useEditorState() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const setImage = useCallback((url: string) => dispatch({ type: 'SET_IMAGE', url }), [])
  const setPalette = useCallback(
    (palette: EditorState['palette']) => dispatch({ type: 'SET_PALETTE', palette }),
    []
  )
  const setTemplate = useCallback(
    (templateId: EditorState['templateId']) => dispatch({ type: 'SET_TEMPLATE', templateId }),
    []
  )
  const setAspectRatio = useCallback(
    (aspectRatio: EditorState['aspectRatio']) => dispatch({ type: 'SET_ASPECT_RATIO', aspectRatio }),
    []
  )
  const setText = useCallback(
    (field: keyof TextContent, value: string) => dispatch({ type: 'SET_TEXT', field, value }),
    []
  )
  const setExportStatus = useCallback(
    (status: EditorState['exportStatus']) => dispatch({ type: 'SET_EXPORT_STATUS', status }),
    []
  )
  const setTransform = useCallback(
    (transform: ImageTransform) => dispatch({ type: 'SET_TRANSFORM', transform }),
    []
  )
  const resetTransform = useCallback(() => dispatch({ type: 'RESET_TRANSFORM' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    state,
    setImage,
    setPalette,
    setTemplate,
    setAspectRatio,
    setText,
    setExportStatus,
    setTransform,
    resetTransform,
    reset,
  }
}
