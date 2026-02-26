/**
 * ── HOME PAGE (Overview / Landing Page) ─────────────────────────────────
 *
 * Primary overview page that renders:
 *   - Hero section with project title and description
 *   - KPI stat cards (total trade, exports, imports for the latest year)
 *   - Trade Trends line chart (exports vs imports over time)
 *   - Trade by Transportation Mode donut chart (interactive — clicking a
 *     slice cross-filters the line chart and top-states bar chart)
 *   - Top 10 U.S. States horizontal bar chart (with link to TradeByState page)
 *
 * Datasets used:
 *   - usAggregated  — drives KPI cards, line chart, and donut chart
 *   - btsUsState    — drives the top-10-states bar chart
 *
 * Layout: This page does NOT use DashboardLayout / FilterSidebar because
 * it has no filter panel. It uses SectionBlock for alternating row backgrounds.
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * 1. Change the dataset import from useTradeStore to match your new data
 * 2. Update the useMemo calculations to aggregate your data columns
 * 3. Update filter options to match your data's filterable fields
 * 4. Update chart props (xKey, yKey, seriesKey, etc.) to match your columns
 * 5. Update DataTable column definitions
 * 6. Update StatCard labels and calculations
 *
 * This is the PRIMARY page to customize when adapting the boilerplate for
 * a new dataset. Start here: change the hero text, KPI formulas, chart
 * data sources, and the section layout to match your project.
 *
 * Key customization points (search for these in the code below):
 *   - "latestYear"       — How the most recent year is determined
 *   - "stats" useMemo    — KPI card calculations (total, exports, imports, change)
 *   - "trendLineData"    — Data transformation for the line chart
 *   - "modeData"         — Data transformation for the donut chart
 *   - "topStates"        — Data transformation for the bar chart
 *   - "handleModeClick"  — Cross-filter interaction between donut and other charts
 *   - Hero section JSX   — Project title, subtitle, and description text
 *   - StatCard props     — Labels, icons, formatting
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, ArrowUpRight, ArrowDownLeft
} from 'lucide-react'
import { useTradeStore } from '@/stores/tradeStore'
import StatCard from '@/components/ui/StatCard'
import ChartCard from '@/components/ui/ChartCard'
import SectionBlock from '@/components/ui/SectionBlock'
import LineChart from '@/components/charts/LineChart'
import DonutChart from '@/components/charts/DonutChart'
import BarChart from '@/components/charts/BarChart'
import { formatCurrency } from '@/lib/chartColors'

export default function HomePage() {
  const { usAggregated, btsUsState, loading } = useTradeStore()
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState(null)

  // REQUIRED COLUMNS (adaptation note for future datasets):
  // - usAggregated: Year, TradeType, TradeValue, Mode
  // - btsUsState:   State, Mode, TradeValue
  // If your schema differs, update the useMemo blocks below (latestYear/stats/trendLineData/modeData/topStates).

  const handleModeClick = (d) => {
    if (!d) return setSelectedMode(null)
    setSelectedMode((prev) => (prev === d.label ? null : d.label))
  }

  const latestYear = useMemo(() => {
    if (!usAggregated?.length) return null
    const years = usAggregated
      .map((d) => Number(d.Year))
      .filter((y) => Number.isFinite(y))
    return years.length ? Math.max(...years) : null
  }, [usAggregated])

  const stats = useMemo(() => {
    if (!usAggregated || !latestYear) return null

    const prevYear = latestYear - 1
    const latest = usAggregated.filter((d) => d.Year === latestYear)
    const prev = usAggregated.filter((d) => d.Year === prevYear)

    const totalLatest = latest.reduce((s, d) => s + (d.TradeValue || 0), 0)
    const totalPrev = prev.reduce((s, d) => s + (d.TradeValue || 0), 0)
    const exports = latest.filter((d) => d.TradeType === 'Export').reduce((s, d) => s + (d.TradeValue || 0), 0)
    const imports = latest.filter((d) => d.TradeType === 'Import').reduce((s, d) => s + (d.TradeValue || 0), 0)

    const change = totalPrev ? ((totalLatest - totalPrev) / totalPrev) : 0

    return { totalLatest, totalPrev, exports, imports, change, latestYear, prevYear }
  }, [usAggregated, latestYear])

  const trendLineData = useMemo(() => {
    if (!usAggregated) return []

    const source = selectedMode
      ? usAggregated.filter((d) => d.Mode === selectedMode)
      : usAggregated

    const byYearType = new Map()
    source.forEach((d) => {
      const key = `${d.Year}|${d.TradeType}`
      if (!byYearType.has(key)) byYearType.set(key, { year: d.Year, value: 0, TradeType: d.TradeType })
      byYearType.get(key).value += d.TradeValue || 0
    })

    return Array.from(byYearType.values()).sort((a, b) => a.year - b.year)
  }, [usAggregated, selectedMode])

  const modeData = useMemo(() => {
    if (!usAggregated) return []
    const byMode = new Map()
    usAggregated.forEach((d) => {
      if (!d.Mode) return
      if (!byMode.has(d.Mode)) byMode.set(d.Mode, 0)
      byMode.set(d.Mode, byMode.get(d.Mode) + (d.TradeValue || 0))
    })
    return Array.from(byMode, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [usAggregated])

  const topStates = useMemo(() => {
    if (!btsUsState) return []

    const source = selectedMode
      ? btsUsState.filter((d) => d.Mode === selectedMode)
      : btsUsState

    const byState = new Map()
    source.forEach((d) => {
      if (!d.State) return
      if (!byState.has(d.State)) byState.set(d.State, 0)
      byState.set(d.State, byState.get(d.State) + (d.TradeValue || 0))
    })
    return Array.from(byState, ([label, value]) => ({ label, value }))
      .filter((d) => d.label && d.label !== 'undefined')
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [btsUsState, selectedMode])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-text-secondary">Loading trade data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <div className="gradient-blue text-white">
        <div className="container-chrome py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-balance text-white">
            U.S.–Mexico Trade Dashboard
          </h2>
          <p className="text-white/70 mt-2 text-base max-w-2xl">
            Comprehensive analysis of bilateral trade between the United States and Mexico,
            including state-level flows, commodity breakdowns, transportation modes, and
            Texas border port activity. Data source: Bureau of Transportation Statistics (2013–{latestYear || '…'}).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <SectionBlock>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <StatCard
            label={`Total Trade (${latestYear || '—'})`}
            value={stats ? formatCurrency(stats.totalLatest) : '—'}
            trend={stats?.change > 0 ? 'up' : 'down'}
            trendLabel={stats ? `${(stats.change * 100).toFixed(1)}% vs ${stats.prevYear}` : ''}
            highlight
            variant="primary"
            icon={DollarSign}
            delay={0}
          />
          <StatCard
            label={`Exports (${latestYear || '—'})`}
            value={stats ? formatCurrency(stats.exports) : '—'}
            highlight
            icon={ArrowUpRight}
            delay={100}
          />
          <StatCard
            label={`Imports (${latestYear || '—'})`}
            value={stats ? formatCurrency(stats.imports) : '—'}
            highlight
            icon={ArrowDownLeft}
            delay={200}
          />
        </div>
      </SectionBlock>

      {/* Trade Trends */}
      <SectionBlock alt>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ChartCard
              title="Trade Trends Over Time"
              subtitle={selectedMode ? `Filtered by: ${selectedMode}` : `Exports vs Imports (2013–${latestYear || '…'})`}
              headerRight={selectedMode && (
                <button
                  onClick={() => setSelectedMode(null)}
                  className="text-base text-brand-blue hover:text-brand-blue-dark font-medium transition-colors"
                >
                  Clear filter &times;
                </button>
              )}
              downloadData={{
                summary: { data: trendLineData, filename: 'trade-trends-summary' },
                detail: { data: selectedMode ? usAggregated?.filter((d) => d.Mode === selectedMode) : usAggregated, filename: 'trade-trends-detail' },
              }}
            >
              <LineChart
                data={trendLineData}
                xKey="year"
                yKey="value"
                seriesKey="TradeType"
              />
            </ChartCard>
          </div>
          <div>
            <ChartCard
              title="Trade by Transportation Mode"
              subtitle="All years combined"
              downloadData={{
                summary: { data: modeData, filename: 'trade-by-mode-summary' },
                detail: { data: usAggregated, filename: 'trade-by-mode-detail' },
              }}
            >
              <DonutChart
                data={modeData}
                onSliceClick={handleModeClick}
                selectedSlice={selectedMode}
              />
            </ChartCard>
          </div>
        </div>
      </SectionBlock>

      {/* Top States */}
      <SectionBlock>
        <ChartCard
          title="Top 10 U.S. States by Trade Volume"
          subtitle={selectedMode ? `Filtered by: ${selectedMode}` : `Total trade with Mexico (2013–${latestYear || '…'})`}
          headerRight={
            <button
              onClick={() => navigate('/trade-by-state')}
              className="text-base text-brand-blue hover:text-brand-blue-dark font-medium transition-colors"
            >
              View all &rarr;
            </button>
          }
          downloadData={{
            summary: { data: topStates, filename: 'top-states-summary' },
            detail: { data: selectedMode ? btsUsState?.filter((d) => d.Mode === selectedMode) : btsUsState, filename: 'top-states-detail' },
          }}
        >
          <BarChart
            data={topStates}
            xKey="label"
            yKey="value"
            horizontal
          />
        </ChartCard>
      </SectionBlock>

    </>
  )
}
