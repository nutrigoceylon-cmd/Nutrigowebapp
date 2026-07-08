import { MessageCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { OrderNowButton } from '../delivery/OrderNowButton'
import { buildWhatsAppUrl } from '../../lib/site'

export function FloatingActions() {
  const { pathname } = useLocation()

  if (pathname !== '/') {
    return null
  }

  return (
    <div className="fixed right-4 bottom-5 z-50 flex flex-col gap-3 sm:right-6 sm:bottom-6">
      <OrderNowButton />

      <a
        href={buildWhatsAppUrl('Hi NutriGo! I would like to place an order.')}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:-translate-y-0.5 hover:bg-[#1fba57]"
      >
        <MessageCircle size={18} />
        WhatsApp
      </a>
    </div>
  )
}
