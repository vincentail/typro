/**
 * Generate all platform icon files from resources/icon.svg
 * Requires: sharp (npm install --save-dev sharp)
 * Run: node scripts/gen-icons.mjs
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'resources', 'icon.svg')
const resourcesDir = path.join(root, 'resources')

const svgBuffer = fs.readFileSync(svgPath)

// ── 1. Master PNG 1024×1024 ────────────────────────────────────────────────
console.log('Generating master PNG 1024×1024...')
await sharp(svgBuffer)
  .resize(1024, 1024)
  .png()
  .toFile(path.join(resourcesDir, 'icon.png'))

// ── 2. macOS .icns via iconutil ────────────────────────────────────────────
const icnsSizes = [16, 32, 64, 128, 256, 512, 1024]
const iconsetDir = path.join(resourcesDir, 'icon.iconset')
fs.mkdirSync(iconsetDir, { recursive: true })

const icnsNameMap = {
  16:   ['icon_16x16.png'],
  32:   ['icon_16x16@2x.png', 'icon_32x32.png'],
  64:   ['icon_32x32@2x.png'],
  128:  ['icon_128x128.png'],
  256:  ['icon_128x128@2x.png', 'icon_256x256.png'],
  512:  ['icon_256x256@2x.png', 'icon_512x512.png'],
  1024: ['icon_512x512@2x.png'],
}

console.log('Generating iconset PNGs...')
for (const size of icnsSizes) {
  const names = icnsNameMap[size]
  const buf = await sharp(svgBuffer).resize(size, size).png().toBuffer()
  for (const name of names) {
    fs.writeFileSync(path.join(iconsetDir, name), buf)
    console.log(`  ${name}`)
  }
}

console.log('Building icon.icns...')
execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(resourcesDir, 'icon.icns')}"`)
fs.rmSync(iconsetDir, { recursive: true })
console.log('  icon.icns ✓')

// ── 3. Windows .ico (multi-size) ───────────────────────────────────────────
// .ico = concatenated DIBs. We build it manually (no ImageMagick needed).
console.log('Generating icon.ico...')

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoImages = await Promise.all(
  icoSizes.map(async (size) => {
    const buf = await sharp(svgBuffer)
      .resize(size, size)
      .png()       // use PNG-compressed entries (Windows Vista+ supports this in ICO)
      .toBuffer()
    return { size, buf }
  })
)

// Build ICO binary: header + directory + image data
const count = icoImages.length
const headerSize = 6
const dirEntrySize = 16
const dirSize = count * dirEntrySize
let offset = headerSize + dirSize

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)     // reserved
header.writeUInt16LE(1, 2)     // type: 1 = ICO
header.writeUInt16LE(count, 4) // count

const dirEntries = []
const imageDataChunks = []

for (const { size, buf } of icoImages) {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0)   // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1)   // height
  entry.writeUInt8(0, 2)                         // color palette count
  entry.writeUInt8(0, 3)                         // reserved
  entry.writeUInt16LE(1, 4)                      // color planes
  entry.writeUInt16LE(32, 6)                     // bits per pixel
  entry.writeUInt32LE(buf.length, 8)             // image data size
  entry.writeUInt32LE(offset, 12)                // offset to image data
  offset += buf.length
  dirEntries.push(entry)
  imageDataChunks.push(buf)
}

const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageDataChunks])
fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), icoBuffer)
console.log('  icon.ico ✓')

// ── 4. Extra PNGs for Linux / tray ────────────────────────────────────────
console.log('Generating extra PNGs for Linux...')
for (const size of [16, 32, 48, 64, 128, 256, 512]) {
  const out = path.join(resourcesDir, `icon-${size}.png`)
  await sharp(svgBuffer).resize(size, size).png().toFile(out)
  console.log(`  icon-${size}.png`)
}

console.log('\n✅ All icons generated successfully.')
