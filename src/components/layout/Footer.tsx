import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import type { SVGProps } from 'react'
import { BrandLogo } from './BrandLogo'

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H16.8V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.2V10H8v3h2.4v8h3.1Z" />
    </svg>
  )
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.35" cy="6.65" r="1.1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.9 3c.5 1.6 1.5 2.8 3.1 3.6.9.5 1.8.7 2 .7v3.2c-.8 0-1.9-.2-3-.7v5.6c0 3.4-2.7 5.8-6.1 5.8-3 0-5.6-2.1-5.9-5-.4-3.7 2.5-6.7 6.1-6.7.3 0 .7 0 1 .1v3.3c-.3-.1-.6-.2-1-.2-1.4 0-2.6 1.1-2.6 2.5 0 1.3 1 2.4 2.3 2.5 1.5.1 2.7-1 2.7-2.5V3h3.4Z" />
    </svg>
  )
}

const socialLinks = [
  { title: 'Facebook', href: 'https://web.facebook.com/profile.php?id=61590527923244', icon: FacebookIcon },
  { title: 'Instagram', href: 'https://www.instagram.com/nutrigoceylon/', icon: InstagramIcon },
  { title: 'TikTok', href: 'https://www.tiktok.com/@nutrigoceylon?is_from_webapp=1&sender_device=pc', icon: TikTokIcon },
]

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center mb-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <BrandLogo imageClassName="h-12 w-auto" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              Scientifically balanced meals, delivered fresh to your door. Helping you achieve your health goals every day.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(s => (
                <a
                  key={s.title}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.title}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/75 transition-colors hover:bg-gold hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/menu', label: 'Our Menu' },
                { to: '/articles', label: 'Articles' },
                { to: '/podcast', label: 'Podcast' },
                { to: '/events', label: 'Events' },
                { to: '/faq', label: 'FAQ' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-white/50 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/contact', label: 'Contact Us' },
                { to: '/faq', label: 'Delivery & Areas' },
                { to: '/faq', label: 'Returns & Refunds' },
                { to: '/faq', label: 'Terms & Conditions' },
                { to: '/faq', label: 'Privacy Policy' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="text-white/50 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account + Contact */}
          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Account</h4>
            <ul className="space-y-2.5 mb-6">
              {[
                { to: '/dashboard', label: 'My Account' },
                { to: '/menu', label: 'My Plans' },
                { to: '/dashboard', label: 'My Orders' },
                { to: '/dashboard', label: 'Track Progress' },
                { to: '/login', label: 'Logout' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="text-white/50 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold text-sm text-white mb-3">Contact Us</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/50 text-sm min-w-0">
                <Phone size={13} className="text-accent-light flex-shrink-0" />
                <span className="break-all">074 413 9923</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm min-w-0">
                <Mail size={13} className="text-accent-light flex-shrink-0" />
                <span className="break-all">info@nutrigoceylon.com</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm min-w-0">
                <MapPin size={13} className="text-accent-light flex-shrink-0" />
                <span className="break-all">103/J, Sunflower Garden, Kahathuduwa, Polgasowita</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/30 text-sm">© 2026 NutriGo Ceylon (Pvt) Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
