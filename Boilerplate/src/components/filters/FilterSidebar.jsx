/**
 * ── FILTER SIDEBAR ──────────────────────────────────────────────────────
 *
 * Fixed right-side sidebar that provides filter controls for dashboard pages.
 * This component is rendered by DashboardLayout and receives filter controls
 * as children from each page component.
 *
 * Features:
 *   - Collapse/expand toggle (PanelRightClose / PanelRightOpen icons)
 *   - Active filter tags — grouped by filter category with individual
 *     remove buttons (X) for each selected value
 *   - "Reset all filters" button — visible when any filters are active
 *   - "Back to top" button — appears after scrolling past 300px
 *   - "Ask AI" button — pinned to bottom of sidebar, appears when the
 *     header's Ask AI button has scrolled out of view
 *   - Sticky positioning — sidebar stays fixed to viewport and adjusts
 *     its top offset to sit below the header/nav chrome
 *
 * Props:
 *   - children      — Filter control components (FilterSelect, FilterMultiSelect)
 *                      passed from the page via DashboardLayout's `filters` prop
 *   - onResetAll    — Callback to clear all filters (provided by the page)
 *   - activeCount   — Number of active filter categories (drives badge count)
 *   - activeTags    — Array of { group, label, onRemove } for rendering tags
 *   - title         — Sidebar header text (default: "Filters")
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * No changes are typically needed in this file when adapting for a new
 * dataset. Filter controls are defined in each page component and passed
 * as children. Only modify this if you want to change the sidebar's
 * layout, styling, collapse behavior, or add/remove global sidebar features.
 */
import { useState, useEffect, useRef } from 'react'
import { Filter, RotateCcw, PanelRightClose, PanelRightOpen, ArrowUp, Sparkles, X } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

export default function FilterSidebar({ children, onResetAll, activeCount = 0, activeTags = [], title = 'Filters' }) {
  const toggleDrawer = useChatStore((s) => s.toggle)
  const [collapsed, setCollapsed] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const asideRef = useRef(null)
  const chromeHeightRef = useRef(0)
  const rafRef = useRef(0)
  const lastScrollTopRef = useRef(false)

  useEffect(() => {
    const measureChrome = () => {
      const nav = document.querySelector('nav')
      if (nav) chromeHeightRef.current = nav.offsetTop + nav.offsetHeight
    }

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (!asideRef.current) return
        const top = Math.max(0, chromeHeightRef.current - window.scrollY)
        asideRef.current.style.top = `${top}px`
        asideRef.current.style.height = `calc(100vh - ${top}px)`

        // Only trigger re-render when crossing the threshold
        const shouldShow = window.scrollY > 300
        if (shouldShow !== lastScrollTopRef.current) {
          lastScrollTopRef.current = shouldShow
          setShowScrollTop(shouldShow)
        }
      })
    }

    const onResize = () => {
      measureChrome()
      onScroll()
    }

    measureChrome()
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const width = collapsed ? 'w-12' : 'w-72'

  return (
    <>
      {/* Spacer to reserve width in document flow */}
      <div className={`flex-shrink-0 ${width} transition-all duration-300 ease-in-out`} />

      {/* Fixed sidebar pinned to viewport, below header/nav */}
      <aside
        ref={asideRef}
        className={`fixed right-0 flex flex-col z-40
          bg-[#edf1f7] border-l border-border-light shadow-sm
          ${width}
        `}
        style={{ top: 0, height: '100vh', transition: 'width 300ms ease-in-out' }}
      >
        {/* Header — always visible, never scrolls */}
        <div
          className={`flex items-center border-b border-border-light bg-[#e4e9f1] flex-shrink-0
            ${collapsed ? 'justify-center py-3 px-1' : 'justify-between px-4 py-3'}`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-brand-blue" />
              <span className="text-base font-semibold text-text-primary">{title}</span>
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full
                               bg-brand-blue text-white text-base font-bold">
                  {activeCount}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-text-secondary hover:text-brand-blue
                       hover:bg-surface-alt transition-all duration-150"
            title={collapsed ? 'Expand filters' : 'Collapse filters'}
          >
            {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Content */}
          {!collapsed && (
            <div className="p-4 space-y-4 animate-fade-in">
              {activeTags.length > 0 && (() => {
                const groups = []
                const seen = new Set()
                activeTags.forEach((tag) => {
                  const g = tag.group || ''
                  if (!seen.has(g)) { seen.add(g); groups.push(g) }
                })
                return (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div key={group} className="flex flex-wrap items-center gap-1.5">
                        {group && (
                          <span className="text-base font-medium text-text-secondary uppercase tracking-wider mr-0.5">
                            {group}:
                          </span>
                        )}
                        {activeTags.filter((t) => (t.group || '') === group).map((tag) => (
                          <span
                            key={tag.label}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-base font-medium
                                       bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                          >
                            {tag.label}
                            <button
                              onClick={tag.onRemove}
                              className="hover:bg-brand-blue/20 rounded-full p-0.5 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              })()}
              {/* Reset — right below active tags */}
              {onResetAll && activeCount > 0 && (
                <button
                  onClick={onResetAll}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-base font-medium
                             text-brand-blue border border-brand-blue/30 rounded-lg
                             hover:bg-brand-blue/5 transition-all duration-150"
                >
                  <RotateCcw size={12} />
                  Reset all filters
                </button>
              )}
              {activeCount > 0 && <div className="border-b border-border-light" />}
              <div className="w-full min-w-0">
                {children}
              </div>

              {/* Scroll to top */}
              {showScrollTop && (
                <button
                  onClick={scrollToTop}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-base font-medium
                             text-text-secondary border border-border-light rounded-lg
                             hover:text-brand-blue hover:border-brand-blue/30 hover:bg-brand-blue/5
                             transition-all duration-200 mt-1"
                >
                  <ArrowUp size={12} />
                  Back to top
                </button>
              )}
            </div>
          )}

          {/* Collapsed icon indicator */}
          {collapsed && activeCount > 0 && (
            <div className="flex flex-col items-center py-3 gap-2">
              <Filter size={14} className="text-brand-blue" />
              <span className="text-base font-bold text-brand-blue bg-brand-blue/10 rounded-full w-6 h-6
                             flex items-center justify-center">
                {activeCount}
              </span>
            </div>
          )}

          {/* Collapsed scroll to top */}
          {collapsed && showScrollTop && (
            <div className="flex justify-center py-2">
              <button
                onClick={scrollToTop}
                className="p-1.5 rounded-md text-text-secondary hover:text-brand-blue
                           hover:bg-surface-alt transition-all duration-150"
                title="Back to top"
              >
                <ArrowUp size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Ask AI — pinned to bottom of sidebar, visible when header button scrolled away */}
        {showScrollTop && (
          <div className={`flex-shrink-0 border-t border-border-light bg-[#e4e9f1]
            ${collapsed ? 'px-1 py-2' : 'px-4 py-3'}`}
          >
            <button
              onClick={toggleDrawer}
              className={`flex items-center justify-center gap-2 rounded-lg
                         text-brand-blue bg-brand-blue/5 border border-brand-blue/20
                         hover:bg-brand-blue/10 hover:border-brand-blue/30
                         transition-all duration-200 cursor-pointer
                         ${collapsed ? 'p-1.5 w-full' : 'w-full px-3 py-2 text-base font-medium'}`}
              title="Ask AI"
            >
              <Sparkles size={collapsed ? 14 : 16} />
              {!collapsed && <span>Ask AI</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
