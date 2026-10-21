import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })

export const PhoneIcon = (p: P) => <svg {...base(p)}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
export const SearchIcon = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
export const MenuIcon = (p: P) => <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
export const CloseIcon = (p: P) => <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>
export const PinIcon = (p: P) => <svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
export const GaugeIcon = (p: P) => <svg {...base(p)}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
export const FuelIcon = (p: P) => <svg {...base(p)}><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M3 22h12M15 10h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V9l-3-3M7 8h4"/></svg>
export const GearIcon = (p: P) => <svg {...base(p)}><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 8v8M12 8v4M18 8v2a2 2 0 0 1-2 2H6"/></svg>
export const CalendarIcon = (p: P) => <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
export const ChevronLeft = (p: P) => <svg {...base(p)}><path d="m15 18-6-6 6-6"/></svg>
export const ChevronRight = (p: P) => <svg {...base(p)}><path d="m9 18 6-6-6-6"/></svg>
export const CheckIcon = (p: P) => <svg {...base(p)}><path d="M20 6 9 17l-5-5"/></svg>
export const ShieldIcon = (p: P) => <svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
export const CashIcon = (p: P) => <svg {...base(p)}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
export const CarIcon = (p: P) => <svg {...base(p)}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.4A2 2 0 0 0 13.7 6H9.3a2 2 0 0 0-1.6.8L5 10l-2.5 1.1C1.7 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>
export const ShareIcon = (p: P) => <svg {...base(p)}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
export const ClockIcon = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
export const MailIcon = (p: P) => <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
export const UploadIcon = (p: P) => <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
export const TrashIcon = (p: P) => <svg {...base(p)}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
export const StarIcon = (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>

export const WhatsAppIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.71.97.99-3.62-.24-.37a9.8 9.8 0 0 1-1.5-5.2c0-5.42 4.41-9.84 9.84-9.84 2.63 0 5.1 1.03 6.96 2.88a9.8 9.8 0 0 1 2.88 6.96c0 5.43-4.41 9.84-9.84 9.84zm8.38-18.22A11.8 11.8 0 0 0 12.05 0C5.5 0 .17 5.33.16 11.88c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z"/>
  </svg>
)
