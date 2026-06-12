/**
 * Minimal JPEG EXIF parser — no external dependencies.
 * Reads GPS coordinates and shooting date from EXIF data in JPEG files.
 */

import Taro from '@tarojs/taro'

// ─── File reading ────────────────────────────────────────────────────────────

function readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    Taro.getFileSystemManager().readFile({
      filePath,
      success: (res) => resolve(res.data as ArrayBuffer),
      fail: (err) => reject(err),
    })
  })
}

// ─── DataView helpers ────────────────────────────────────────────────────────

function u16(view: DataView, offset: number, le: boolean) {
  return view.getUint16(offset, le)
}
function u32(view: DataView, offset: number, le: boolean) {
  return view.getUint32(offset, le)
}
function ascii(view: DataView, offset: number, len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) {
    const c = view.getUint8(offset + i)
    if (c === 0) break
    s += String.fromCharCode(c)
  }
  return s
}

// ─── EXIF location ───────────────────────────────────────────────────────────

/**
 * Scan JPEG markers to find the EXIF APP1 segment.
 * Returns the byte offset of the TIFF header inside the buffer, or -1.
 */
function findTiffStart(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  const len = buffer.byteLength
  if (view.getUint16(0) !== 0xffd8) return -1   // not a JPEG

  let pos = 2
  while (pos < len - 2) {
    const marker = view.getUint16(pos)
    pos += 2
    if (marker === 0xffe1) {
      // APP1: check for "Exif\0\0"
      const segLen = view.getUint16(pos)
      if (ascii(view, pos + 2, 4) === 'Exif' && view.getUint8(pos + 6) === 0) {
        return pos + 8   // TIFF header starts right after "Exif\0\0"
      }
      pos += segLen
    } else if ((marker & 0xff00) === 0xff00) {
      pos += view.getUint16(pos)   // skip other segments
    } else {
      break
    }
  }
  return -1
}

// ─── Rational → decimal ──────────────────────────────────────────────────────

function rational(view: DataView, offset: number, le: boolean): number {
  const num = u32(view, offset, le)
  const den = u32(view, offset + 4, le)
  return den === 0 ? 0 : num / den
}

/** GPS DMS (3 × RATIONAL) → decimal degrees */
function dmsToDecimal(view: DataView, offset: number, le: boolean): number {
  const deg = rational(view, offset, le)
  const min = rational(view, offset + 8, le)
  const sec = rational(view, offset + 16, le)
  return deg + min / 60 + sec / 3600
}

// ─── IFD walker ──────────────────────────────────────────────────────────────

interface IfdEntry {
  tag: number
  type: number
  count: number
  valueOrOffset: number   // absolute offset in buffer (after applying entryOffset+8)
}

function readIfd(view: DataView, ifdOffset: number, le: boolean): IfdEntry[] {
  const count = u16(view, ifdOffset, le)
  const entries: IfdEntry[] = []
  for (let i = 0; i < count; i++) {
    const base = ifdOffset + 2 + i * 12
    entries.push({
      tag: u16(view, base, le),
      type: u16(view, base + 2, le),
      count: u32(view, base + 4, le),
      valueOrOffset: base + 8,
    })
  }
  return entries
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface GPSCoords {
  latitude: number
  longitude: number
}

export interface ExifData {
  gps: GPSCoords | null
  date: string | null   // formatted as "YYYY.MM.DD"
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export async function getExifData(filePath: string): Promise<ExifData> {
  const result: ExifData = { gps: null, date: null }

  try {
    console.log('[exifGPS] 开始读取文件:', filePath)
    const buffer = await readFileAsBuffer(filePath)
    console.log('[exifGPS] 文件大小:', buffer.byteLength, 'bytes')

    const tiffStart = findTiffStart(buffer)
    if (tiffStart < 0) {
      console.log('[exifGPS] ❌ 未找到 EXIF（截图或压缩图）')
      return result
    }
    console.log('[exifGPS] ✅ 找到 EXIF，tiffStart:', tiffStart)

    const view = new DataView(buffer)
    const bom = u16(view, tiffStart, false)
    if (bom !== 0x4949 && bom !== 0x4d4d) {
      console.log('[exifGPS] ❌ 字节序标记无效')
      return result
    }
    const le = bom === 0x4949
    console.log('[exifGPS] 字节序:', le ? 'Little-Endian' : 'Big-Endian')

    if (u16(view, tiffStart + 2, le) !== 0x002a) {
      console.log('[exifGPS] ❌ TIFF magic 校验失败')
      return result
    }

    const ifd0Offset = tiffStart + u32(view, tiffStart + 4, le)
    const ifd0 = readIfd(view, ifd0Offset, le)
    console.log('[exifGPS] IFD0 tags:', ifd0.map(e => '0x' + e.tag.toString(16)).join(', '))

    // ── GPS IFD (tag 0x8825) ──────────────────────────────────────────────
    const gpsEntry = ifd0.find(e => e.tag === 0x8825)
    if (gpsEntry) {
      const gpsIfdOffset = tiffStart + u32(view, gpsEntry.valueOrOffset, le)
      console.log('[exifGPS] GPS IFD offset:', gpsIfdOffset)
      const gpsEntries = readIfd(view, gpsIfdOffset, le)

      let latRef = '', lngRef = '', lat = -1, lng = -1

      for (const e of gpsEntries) {
        if (e.tag === 0x0001) {
          latRef = String.fromCharCode(view.getUint8(e.valueOrOffset))
        } else if (e.tag === 0x0002 && e.type === 5 && e.count === 3) {
          lat = dmsToDecimal(view, tiffStart + u32(view, e.valueOrOffset, le), le)
        } else if (e.tag === 0x0003) {
          lngRef = String.fromCharCode(view.getUint8(e.valueOrOffset))
        } else if (e.tag === 0x0004 && e.type === 5 && e.count === 3) {
          lng = dmsToDecimal(view, tiffStart + u32(view, e.valueOrOffset, le), le)
        }
      }

      if (lat >= 0 && lng >= 0) {
        result.gps = {
          latitude: latRef === 'S' ? -lat : lat,
          longitude: lngRef === 'W' ? -lng : lng,
        }
        console.log('[exifGPS] ✅ GPS:', result.gps)
      } else {
        console.log('[exifGPS] GPS IFD 存在但坐标不完整 lat:', lat, 'lng:', lng)
      }
    } else {
      console.log('[exifGPS] IFD0 中没有 GPS IFD tag，照片未开定位')
    }

    // ── EXIF Sub-IFD (tag 0x8769) → DateTimeOriginal (tag 0x9003) ────────
    const exifIfdEntry = ifd0.find(e => e.tag === 0x8769)
    if (exifIfdEntry) {
      const exifIfdOffset = tiffStart + u32(view, exifIfdEntry.valueOrOffset, le)
      console.log('[exifGPS] EXIF Sub-IFD offset:', exifIfdOffset)
      const exifEntries = readIfd(view, exifIfdOffset, le)

      const dateEntry = exifEntries.find(e => e.tag === 0x9003)  // DateTimeOriginal
        ?? exifEntries.find(e => e.tag === 0x0132)               // fallback: DateTime
      if (dateEntry) {
        // ASCII string, value stored at offset if count > 4
        const strOffset = dateEntry.count > 4
          ? tiffStart + u32(view, dateEntry.valueOrOffset, le)
          : dateEntry.valueOrOffset
        const raw = ascii(view, strOffset, dateEntry.count)
        console.log('[exifGPS] 原始日期字符串:', raw)
        // EXIF date format: "YYYY:MM:DD HH:MM:SS"
        const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})/)
        if (m) {
          result.date = `${m[1]}.${m[2]}.${m[3]}`
          console.log('[exifGPS] ✅ 拍摄日期:', result.date)
        }
      } else {
        console.log('[exifGPS] EXIF Sub-IFD 中没有日期 tag')
      }
    } else {
      console.log('[exifGPS] IFD0 中没有 EXIF Sub-IFD tag (0x8769)')
    }
  } catch (e) {
    console.error('[exifGPS] ❌ 异常:', e)
  }

  return result
}

// ─── Keep old export for compatibility (used nowhere else, but just in case) ─

/** @deprecated use getExifData instead */
export async function getExifGPS(filePath: string): Promise<GPSCoords | null> {
  return (await getExifData(filePath)).gps
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function formatGPSCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`
}
