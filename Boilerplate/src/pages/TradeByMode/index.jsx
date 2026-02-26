/**
 * ── TRADE BY MODE PAGE (Transportation Mode Analysis) ───────────────────
 *
 * Transportation mode analysis page that renders:
 *   - PageHeader with breadcrumbs
 *   - KPI stat cards (total trade + top 3 modes with dynamic icons)
 *   - Donut chart — mode share (proportion of trade by mode)
 *   - Vertical bar chart — mode comparison (trade value by mode)
 *   - Multi-series line chart — mode trends over time
 *   - Stacked bar chart — mode composition by year (year on x-axis,
 *     each mode as a stacked segment)
 *   - DataTable — mode detail with export/import breakdown
 *
 * Filters (in right sidebar via DashboardLayout + FilterSidebar):
 *   - Year        (multi-select)
 *   - Trade Type  (single-select: Export / Import)
 *
 * Dataset used:
 *   - usAggregated — columns: Year, State, Commodity, Mode, CommodityGroup,
 *                    TradeType, TradeValue
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * 1. Change the dataset import from useTradeStore to match your new data
 * 2. Update the useMemo calculations to aggregate your data columns
 * 3. Update filter options to match your data's filterable fields
 * 4. Update chart props (xKey, yKey, seriesKey, etc.) to match your columns
 * 5. Update DataTable column definitions
 * 6. Update StatCard labels and calculations
 *
 * This page demonstrates the widest variety of chart types in one view:
 * donut, bar, line, and stacked bar. The stacked bar chart requires a
 * pivoted data shape where each row has { year, ModeA: val, ModeB: val, ... }
 * and a separate "keys" array listing the stack segments.
 *
 * Key customization points:
 *   - "modeData" useMemo       — Aggregation for the donut + bar charts
 *   - "modeTrends" useMemo     — Aggregation for the multi-series line chart
 *   - "stackedData" useMemo    — Pivoted data for StackedBarChart
 *   - "modeByTradeType" useMemo — Export/import breakdown for the DataTable
 *   - "modeIcon" function      — Maps category names to Lucide icons for StatCards
 *   - StackedBarChart props    — xKey="year", stackKeys={array of mode names}
 */
import { useMemo, useState } from 'react'
import { useTradeStore } from '@/stores/tradeStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PageHeader from '@/components/ui/PageHeader'
import SectionBlock from '@/components/ui/SectionBlock'
import StatCard from '@/components/ui/StatCard'
import ChartCard from '@/components/ui/ChartCard'
import FilterSelect from '@/components/filters/FilterSelect'
import FilterMultiSelect from '@/components/filters/FilterMultiSelect'
import DataTable from '@/components/ui/DataTable'
import DonutChart from '@/components/charts/DonutChart'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import StackedBarChart from '@/components/charts/StackedBarChart'
import { formatCurrency } from '@/lib/chartColors'
import { Truck, Ship, Train, DollarSign } from 'lucide-react'

export default function TradeByModePage() {
  const { usAggregated, loading } = useTradeStore()
  const [yearFilter, setYearFilter] = useState([])
  const [tradeTypeFilter, setTradeTypeFilter] = useState('')

  // REQUIRED COLUMNS for this page: Year, TradeType, Mode, TradeValue.
  // This page is sensitive to Mode labels because they become dynamic stack keys.

  const years = useMemo(() => {
    if (!usAggregated) return []
    return [...new Set(
      usAggregated
        .map((d) => Number(d.Year))
        .filter((y) => Number.isFinite(y)),
    )].sort((a, b) => b - a)
  }, [usAggregated])

  const filtered = useMemo(() => {
    if (!usAggregated) return []
    return usAggregated.filter((d) => {
      if (yearFilter.length > 0 && !yearFilter.includes(String(d.Year))) return false
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return false
      return true
    })
  }, [usAggregated, yearFilter, tradeTypeFilter])

  const activeFilters = [yearFilter.length > 0, tradeTypeFilter].filter(Boolean).length

  const modeData = useMemo(() => {
    const byMode = new Map()
    filtered.forEach((d) => {
      if (!d.Mode) return
      if (!byMode.has(d.Mode)) byMode.set(d.Mode, 0)
      byMode.set(d.Mode, byMode.get(d.Mode) + (d.TradeValue || 0))
    })
    return Array.from(byMode, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const stats = useMemo(() => {
    const total = filtered.reduce((s, d) => s + (d.TradeValue || 0), 0)
    return { total }
  }, [filtered])

  const modeTrends = useMemo(() => {
    if (!usAggregated) return []
    const byModeYear = new Map()
    usAggregated.forEach((d) => {
      if (!d.Mode) return
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return
      const key = `${d.Mode}|${d.Year}`
      if (!byModeYear.has(key)) byModeYear.set(key, { year: d.Year, Mode: d.Mode, value: 0 })
      byModeYear.get(key).value += d.TradeValue || 0
    })
    return Array.from(byModeYear.values())
  }, [usAggregated, tradeTypeFilter])

  const stackedData = useMemo(() => {
    if (!usAggregated) return { data: [], keys: [] }
    // StackedBarChart expects wide rows like:
    // { year: 2024, Truck: 123, Rail: 45, Vessel: 67, ... } plus stack key array.
    const allModes = [...new Set(usAggregated.map((d) => d.Mode))].filter(Boolean)
    const byYear = new Map()
    usAggregated.forEach((d) => {
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return
      if (!byYear.has(d.Year)) {
        const entry = { year: d.Year }
        allModes.forEach((m) => (entry[m] = 0))
        byYear.set(d.Year, entry)
      }
      if (d.Mode) byYear.get(d.Year)[d.Mode] += d.TradeValue || 0
    })
    return {
      data: Array.from(byYear.values()).sort((a, b) => a.year - b.year),
      keys: allModes,
    }
  }, [usAggregated, tradeTypeFilter])

  const modeByTradeType = useMemo(() => {
    const result = new Map()
    filtered.forEach((d) => {
      if (!d.Mode) return
      if (!result.has(d.Mode)) result.set(d.Mode, { Mode: d.Mode, Export: 0, Import: 0, Total: 0 })
      const entry = result.get(d.Mode)
      // Explicit checks keep unknown trade labels from being misclassified as imports.
      if (d.TradeType === 'Export') entry.Export += d.TradeValue || 0
      if (d.TradeType === 'Import') entry.Import += d.TradeValue || 0
      entry.Total += d.TradeValue || 0
    })
    return Array.from(result.values()).sort((a, b) => b.Total - a.Total)
  }, [filtered])

  const modeIcon = (mode) => {
    if (mode?.includes('Truck')) return Truck
    if (mode?.includes('Vessel')) return Ship
    if (mode?.includes('Rail')) return Train
    return Truck
  }

  const resetFilters = () => {
    setYearFilter([])
    setTradeTypeFilter('')
  }

  const activeTags = [
    ...yearFilter.map((y) => ({ group: 'Year', label: y, onRemove: () => setYearFilter(yearFilter.filter((v) => v !== y)) })),
    ...(tradeTypeFilter ? [{ group: 'Trade Type', label: tradeTypeFilter, onRemove: () => setTradeTypeFilter('') }] : []),
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filterPanel = (
    <>
      <FilterMultiSelect label="Year" value={yearFilter} onChange={setYearFilter}
        options={years.map((y) => ({ value: String(y), label: String(y) }))} />
      <FilterSelect label="Trade Type" value={tradeTypeFilter} onChange={setTradeTypeFilter}
        options={['Export', 'Import']} />
    </>
  )

  return (
    <>
      <PageHeader
        title="Trade by Transportation Mode"
        subtitle="How goods move between the U.S. and Mexico"
        breadcrumbs={[{ label: 'Overview', path: '/' }, { label: 'Transportation Mode' }]}
      />

      <DashboardLayout filters={filterPanel} onResetAll={resetFilters} activeCount={activeFilters} activeTags={activeTags}>
        <SectionBlock>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Trade" value={formatCurrency(stats.total)} icon={DollarSign} highlight variant="primary" delay={0} />
            {modeData.slice(0, 3).map((m, i) => (
              <StatCard key={m.label} label={m.label} value={formatCurrency(m.value)} icon={modeIcon(m.label)} delay={(i + 1) * 100} />
            ))}
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Mode Share" subtitle="Proportion of trade by transportation mode"
              downloadData={{ summary: { data: modeData, filename: 'mode-share-summary' }, detail: { data: filtered, filename: 'mode-share-detail' } }}>
              <DonutChart data={modeData} />
            </ChartCard>
            <ChartCard title="Mode Comparison" subtitle="Trade value by mode"
              downloadData={{ summary: { data: modeData, filename: 'mode-comparison-summary' }, detail: { data: filtered, filename: 'mode-comparison-detail' } }}>
              <BarChart data={modeData} xKey="label" yKey="value" horizontal />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Mode Trends Over Time" subtitle="Annual trade by transportation mode"
              downloadData={{ summary: { data: modeTrends, filename: 'mode-trends-summary' }, detail: { data: filtered, filename: 'mode-trends-detail' } }}>
              <LineChart data={modeTrends} xKey="year" yKey="value" seriesKey="Mode" />
            </ChartCard>
            <ChartCard title="Stacked View" subtitle="Mode composition by year"
              downloadData={{ summary: { data: stackedData.data, filename: 'mode-stacked-summary' }, detail: { data: filtered, filename: 'mode-stacked-detail' } }}>
              <StackedBarChart data={stackedData.data} xKey="year" stackKeys={stackedData.keys} />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <ChartCard title="Mode Detail" subtitle="Exports and imports by transportation mode"
            className="w-full mx-auto"
            downloadData={{ summary: { data: modeByTradeType, filename: 'mode-detail-summary' }, detail: { data: filtered, filename: 'mode-detail' } }}>
            <DataTable
              columns={[
                { key: 'Mode', label: 'Mode' },
                { key: 'Total', label: 'Total Trade', render: (v) => formatCurrency(v) },
                { key: 'Export', label: 'Exports', render: (v) => formatCurrency(v) },
                { key: 'Import', label: 'Imports', render: (v) => formatCurrency(v) },
              ]}
              data={modeByTradeType}
            />
          </ChartCard>
        </SectionBlock>
      </DashboardLayout>
    </>
  )
}
