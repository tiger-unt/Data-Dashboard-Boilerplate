/**
 * FullscreenChart.jsx — Full-viewport chart overlay (data-agnostic)
 * -----------------------------------------------------------------
 * Renders a full-screen overlay that is portalled to document.body by ChartCard.
 * It displays the same chart children at full viewport size with enlarged
 * typography and provides its own action buttons (PNG export, CSV download, close).
 *
 * Behavior
 *   - Pressing the Escape key closes the overlay (keydown listener)
 *   - Body scroll is disabled while the overlay is open; restored on unmount
 *   - Uses fixed positioning with z-index 100 and a fade-in animation
 *   - The chart area fills the remaining viewport height below the header bar
 *
 * Props
 *   @param {string}      title        — Chart heading, displayed larger than in ChartCard
 *   @param {string}     [subtitle]    — Optional secondary description line
 *   @param {ReactNode}   children     — The chart component(s) to render at full size
 *   @param {object}     [downloadData] — { summary?: { data, filename }, detail?: { data, filename } }
 *   @param {Function}    onClose      — Callback to close the overlay (called on Escape or button click)
 *
 * BOILERPLATE NOTE:
 *   This component is fully data-agnostic. No changes are needed when adapting
 *   this boilerplate for a new project or dataset.
 */
import { useEffect, useRef } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import DownloadButton from '@/components/ui/DownloadButton'
import { exportChartPng } from '@/lib/exportPng'

/**
 * Fullscreen overlay for a chart. Renders the chart children at full viewport
 * size with enlarged typography and action buttons.
 */
export default function FullscreenChart({
  title,
  subtitle,
  children,
  downloadData,
  onClose,
}) {
  const chartAreaRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while fullscreen is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleExportPng = () => {
    exportChartPng(
      chartAreaRef.current,
      title?.replace(/\s+/g, '-').toLowerCase() || 'chart',
      title,
      subtitle,
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5 border-b border-border-light flex-shrink-0">
        {/* Title area */}
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-bold text-text-primary leading-snug truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base md:text-xl text-text-secondary mt-1 truncate">{subtitle}</p>
          )}
        </div>

        {/* Action buttons — labels hidden on mobile to save space */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {downloadData && (
            <DownloadButton
              summary={downloadData.summary}
              detail={downloadData.detail}
              size="fullscreen"
            />
          )}
          <button
            onClick={handleExportPng}
            className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-base font-medium
                       text-text-secondary bg-surface-alt hover:bg-gray-200
                       border border-border-light transition-all duration-150"
            title="Export as PNG"
          >
            <ImageIcon size={18} />
            <span className="hidden md:inline">Export PNG</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-base font-medium
                       text-white bg-brand-blue hover:bg-brand-blue-dark
                       transition-all duration-150"
            title="Close full screen (Esc)"
          >
            <X size={18} />
            <span className="hidden md:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Chart area — fills remaining viewport */}
      <div
        ref={chartAreaRef}
        className="flex-1 p-4 md:p-8 overflow-hidden fullscreen-chart-area"
      >
        {children}
      </div>
    </div>
  )
}
