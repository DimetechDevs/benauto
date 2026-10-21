import { useEffect, useRef, useState } from 'react'
import type { VehicleImage } from '../lib/types'
import { photoUrl } from '../lib/supabase'
import { CarIcon, ChevronLeft, ChevronRight, CloseIcon } from './Icons'

export default function Gallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(false)
  const touchX = useRef<number | null>(null)
  const n = sorted.length
  const go = (d: number) => setI((x) => (x + d + n) % n)

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  })

  if (!n) {
    return <div className="grid aspect-[16/10] place-items-center rounded-lg bg-neutral-100 text-neutral-300"><CarIcon width={80} height={80} /></div>
  }

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return
      const dx = e.changedTouches[0].clientX - touchX.current
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      touchX.current = null
    },
  }
  const current = sorted[i]

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-neutral-900" {...swipe}>
        <button className="block aspect-[16/10] w-full" onClick={() => setZoom(true)} aria-label="View full screen">
          <img src={photoUrl(current.storage_path)!} alt={current.alt_text || `${title} photo ${i + 1}`} className="h-full w-full object-cover" />
        </button>
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Previous photo"><ChevronLeft /></button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -tranneutral-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Next photo"><ChevronRight /></button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{i + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {sorted.map((img, idx) => (
            <button key={img.id} onClick={() => setI(idx)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${idx === i ? 'ring-ink' : 'ring-transparent opacity-70 hover:opacity-100'}`} aria-label={`Show photo ${idx + 1}`}>
              <img src={photoUrl(img.thumb_path || img.storage_path)!} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" aria-label={`${title} photos`} {...swipe}>
          <button onClick={() => setZoom(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><CloseIcon /></button>
          <img src={photoUrl(current.storage_path)!} alt={current.alt_text || title} className="max-h-[90vh] max-w-[95vw] object-contain" />
          {n > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo"><ChevronLeft /></button>
              <button onClick={() => go(1)} className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo"><ChevronRight /></button>
              <span className="absolute bottom-5 text-sm text-white/80">{i + 1} / {n}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
