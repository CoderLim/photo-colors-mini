/**
 * Minimal JPEG EXIF GPS parser — no external dependencies.
 * Reads GPS coordinates from EXIF data embedded in JPEG files.
 */

import Taro from '@tarojs/taro'

/** Read a file as ArrayBuffer */
function readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath,
      success: (res) => resolve(res.data as ArrayBuffer),
      fail: (err) => reject(err),
    })
  })
}

/** Read a 16-bit unsigned int from DataView */
function readUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian)
}

/** Read a 32-bit unsigned int from DataView */
function readUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian)
}

/** Convert EXIF rational (numerator/denominator pair) to decimal */
function rationalToDecimal(
  view: DataView,
  offset: number,
  littleEndian: boolean
): number {
  const numerator = readUint32(view, offset, littleEndian)
  const denominator = readUint32(view, offset + 4, littleEndian)
  return denominator === 0 ? 0 : numerator / denominator
}

/** Parse GPS degrees/minutes/seconds stored as 3 rationals → decimal degrees */
function parseDMS(
  view: DataView,
  valueOffset: number,
  littleEndian: boolean
): number {
  const degrees = rationalToDecimal(view, valueOffset, littleEndian)
  const minutes = rationalToDecimal(view, valueOffset + 8, littleEndian)
  const seconds = rationalToDecimal(view, valueOffset + 16, littleEndian)
  return degrees + minutes / 60 + seconds / 3600
}

/** Read ASCII string from DataView */
function readAscii(view: DataView, offset: number, length: number): string {
  let str = ''
  for (let i = 0; i < length; i++) {
    const code = view.getUint8(offset + i)
    if (code === 0) break
    str += String.fromCharCode(code)
  }
  return str
}

/**
 * Find the EXIF APP1 segment in a JPEG ArrayBuffer.
 * Returns the offset just after the EXIF header (pointing at the TIFF header),
 * or -1 if not found.
 */
function findExifOffset(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  const length = buffer.byteLength

  // JPEG must start with SOI (0xFFD8)
  if (view.getUint16(0) !== 0xffd8) return -1

  let offset = 2
  while (offset < length - 2) {
    const marker = view.getUint16(offset)
    offset += 2
    if (marker === 0xffe1) {
      // APP1 marker — check for "Exif\0\0"
      const segmentLength = view.getUint16(offset) // includes 2 bytes for length field
      if (
        readAscii(view, offset + 2, 4) === 'Exif' &&
        view.getUint8(offset + 6) === 0
      ) {
        // TIFF header starts at offset + 8 (after 2-byte length + "Exif\0\0")
        return offset + 8
      }
      offset += segmentLength
    } else if ((marker & 0xff00) === 0xff00) {
      // Other segment — skip by segment length
      offset += view.getUint16(offset)
    } else {
      break
    }
  }
  return -1
}

export interface GPSCoords {
  latitude: number
  longitude: number
}

/**
 * Parse GPS coordinates from a JPEG file path.
 * Returns null if the file has no EXIF, no GPS, or any error occurs.
 */
export async function getExifGPS(filePath: string): Promise<GPSCoords | null> {
  try {
    const buffer = await readFileAsBuffer(filePath)
    const tiffStart = findExifOffset(buffer)
    if (tiffStart < 0) return null

    const view = new DataView(buffer)

    // Determine byte order: "II" = little-endian (Intel), "MM" = big-endian (Motorola)
    const byteOrderMark = readUint16(view, tiffStart, false)
    if (byteOrderMark !== 0x4949 && byteOrderMark !== 0x4d4d) return null
    const le = byteOrderMark === 0x4949

    // TIFF magic (0x002A)
    if (readUint16(view, tiffStart + 2, le) !== 0x002a) return null

    // Offset to IFD0
    const ifd0Offset = tiffStart + readUint32(view, tiffStart + 4, le)

    // Walk IFD0 to find GPS IFD pointer (tag 0x8825)
    const ifd0Count = readUint16(view, ifd0Offset, le)
    let gpsIfdOffset = -1

    for (let i = 0; i < ifd0Count; i++) {
      const entryOffset = ifd0Offset + 2 + i * 12
      const tag = readUint16(view, entryOffset, le)
      if (tag === 0x8825) {
        gpsIfdOffset = tiffStart + readUint32(view, entryOffset + 8, le)
        break
      }
    }

    if (gpsIfdOffset < 0) return null

    // Walk GPS IFD
    const gpsCount = readUint16(view, gpsIfdOffset, le)

    let latRef = ''
    let lngRef = ''
    let latitude = -1
    let longitude = -1

    for (let i = 0; i < gpsCount; i++) {
      const entryOffset = gpsIfdOffset + 2 + i * 12
      const tag = readUint16(view, entryOffset, le)
      const type = readUint16(view, entryOffset + 2, le)
      const count = readUint32(view, entryOffset + 4, le)
      const valueOrOffset = entryOffset + 8

      if (tag === 0x0001) {
        // GPSLatitudeRef — ASCII "N" or "S"
        latRef = String.fromCharCode(view.getUint8(valueOrOffset))
      } else if (tag === 0x0002) {
        // GPSLatitude — 3 rationals
        if (type === 5 && count === 3) {
          const dataOffset = tiffStart + readUint32(view, valueOrOffset, le)
          latitude = parseDMS(view, dataOffset, le)
        }
      } else if (tag === 0x0003) {
        // GPSLongitudeRef — ASCII "E" or "W"
        lngRef = String.fromCharCode(view.getUint8(valueOrOffset))
      } else if (tag === 0x0004) {
        // GPSLongitude — 3 rationals
        if (type === 5 && count === 3) {
          const dataOffset = tiffStart + readUint32(view, valueOrOffset, le)
          longitude = parseDMS(view, dataOffset, le)
        }
      }
    }

    if (latitude < 0 || longitude < 0) return null

    return {
      latitude: latRef === 'S' ? -latitude : latitude,
      longitude: lngRef === 'W' ? -longitude : longitude,
    }
  } catch {
    return null
  }
}

/**
 * Format GPS coordinates into a human-readable string.
 * Example: 24.43°N, 120.31°E
 */
export function formatGPSCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  const latStr = Math.abs(lat).toFixed(2)
  const lngStr = Math.abs(lng).toFixed(2)
  return `${latStr}°${latDir}, ${lngStr}°${lngDir}`
}
