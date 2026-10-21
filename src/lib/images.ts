/** Resize an image in the browser so uploads stay small on mobile data. */
export async function resizeImage(file: File, maxSize: number, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality))
  if (blob) return blob
  // Older Safari cannot encode WebP; fall back to JPEG.
  return new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not process image'))), 'image/jpeg', quality))
}
