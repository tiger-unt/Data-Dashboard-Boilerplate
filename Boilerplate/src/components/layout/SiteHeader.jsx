/**
 * ── SITE HEADER ─────────────────────────────────────────────────────────
 *
 * Top-level header displayed on every page. Contains:
 *   - Logo image (left side) — loads from /assets/Logos/ with graceful
 *     error handling (hides if image fails to load)
 *   - Dashboard title (h1) and subtitle text
 *   - "Ask AI" button (right side, desktop only) — opens the AI chat drawer
 *
 * Layout: Uses container-chrome (max-width 1280px centered) for consistent
 * alignment with the MainNav below it.
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * When setting up a new project, change these three things:
 *   1. Logo image path — update the `src` attribute on the <img> tag
 *      (place your logo in public/assets/Logos/ or update the path)
 *   2. Dashboard title — update the <h1> text
 *   3. Subtitle — update the <p> text below the title
 *
 * The "Ask AI" button connects to the chatStore. If your project doesn't
 * need an AI chat feature, remove the button and the chatStore import.
 */
import { Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

export default function SiteHeader() {
  const toggleDrawer = useChatStore((s) => s.toggle)

  return (
    <header className="bg-white border-b border-border-light">
      <div className="container-chrome flex items-center justify-between py-4 gap-6">
        {/* Logo + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <img
            src="/assets/Logos/TxDOT-Logo-Vertical-RGB.svg"
            alt="TxDOT"
            className="h-12 md:h-14 w-auto flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-brand-blue leading-tight truncate">
              U.S.–Mexico Trade Dashboard
            </h1>
            <p className="text-base text-text-secondary mt-0.5 truncate">
              International Trade &amp; Border Planning Branch
            </p>
          </div>
        </div>

        {/* Ask AI */}
        <button
          onClick={toggleDrawer}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full
                     bg-brand-blue/5 border border-brand-blue/20 text-base text-brand-blue
                     hover:bg-brand-blue/10 hover:border-brand-blue/30
                     transition-all duration-200 cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Ask AI</span>
        </button>
      </div>
    </header>
  )
}
