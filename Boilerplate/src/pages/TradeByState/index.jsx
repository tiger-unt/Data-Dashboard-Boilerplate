/**
 * ── TRADE BY STATE PAGE (Entity-Level Breakdown) ────────────────────────
 *
 * State-level trade analysis page that renders:
 *   - PageHeader with breadcrumbs
 *   - KPI stat cards (total trade, exports, imports, state count)
 *   - Horizontal bar chart — states ranked by trade volume
 *   - Map placeholder — reserved for a future choropleth/geographic visual
 *   - Line chart — top 5 state trends over time
 *   - DataTable — sortable table with state-level export/import breakdown
 *
 * Filters (in right sidebar via DashboardLayout + FilterSidebar):
 *   - Year        (multi-select)
 *   - Trade Type  (single-select: Export / Import)
 *   - Mode        (multi-select)
 *
 * Dataset used:
 *   - btsUsState  — columns: State, StateCode, Year, TradeType, Mode, TradeValue
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * 1. Change the dataset import from useTradeStore to match your new data
 * 2. Update the useMemo calculations to aggregate your data columns
 * 3. Update filter options to match your data's filterable fields
 * 4. Update chart props (xKey, yKey, seriesKey, etc.) to match your columns
 * 5. Update DataTable column definitions
 * 6. Update StatCard labels and calculations
 *
 * This page is the best TEMPLATE to duplicate when creating a new
 * entity-level breakdown page (e.g., "Trade by Country", "Sales by Region").
 * Copy this file, rename the component, swap the dataset, and adjust
 * the filter/aggregation/chart logic to match your entity's columns.
 *
 * Key customization points:
 *   - "filtered" useMemo     — Where filter state is applied to raw data
 *   - "topStates" useMemo    — Aggregation that powers the bar chart
 *   - "stateTrends" useMemo  — Aggregation that powers the line chart
 *   - "tableData" useMemo    — Row-level calculations for the DataTable
 *   - "filterPanel" JSX      — The filter controls rendered in the sidebar
 *   - DataTable columns      — Column definitions (key, label, render)
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
import MapPlaceholder from '@/components/ui/MapPlaceholder'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import { formatCurrency } from '@/lib/chartColors'
import { DollarSign, ArrowUpRight, ArrowDownLeft, Map as MapIcon } from 'lucide-react'

export default function TradeByStatePage() {
  const { btsUsState, loading } = useTradeStore()
  const [yearFilter, setYearFilter] = useState([])
  const [tradeTypeFilter, setTradeTypeFilter] = useState('')
  const [modeFilter, setModeFilter] = useState([])

  // REQUIRED COLUMNS for this page: Year, TradeType, Mode, State, TradeValue.
  // Adapt these useMemo blocks if your next project uses different field names.

  const years = useMemo(() => {
    if (!btsUsState) return []
    return [...new Set(
      btsUsState
        .map((d) => Number(d.Year))
        .filter((y) => Number.isFinite(y)),
    )].sort((a, b) => b - a)
  }, [btsUsState])

  const modes = useMemo(() => {
    if (!btsUsState) return []
    return [...new Set(btsUsState.map((d) => d.Mode))].filter(Boolean).sort()
  }, [btsUsState])

  const filtered = useMemo(() => {
    if (!btsUsState) return []
    return btsUsState.filter((d) => {
      // yearFilter stores string values because FilterMultiSelect emits string options.
      if (yearFilter.length > 0 && !yearFilter.includes(String(d.Year))) return false
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return false
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return false
      return true
    })
  }, [btsUsState, yearFilter, tradeTypeFilter, modeFilter])

  const activeFilters = [yearFilter.length > 0, tradeTypeFilter, modeFilter.length > 0].filter(Boolean).length

  const stats = useMemo(() => {
    const total = filtered.reduce((s, d) => s + (d.TradeValue || 0), 0)
    const exports = filtered.filter((d) => d.TradeType === 'Export').reduce((s, d) => s + (d.TradeValue || 0), 0)
    const imports = filtered.filter((d) => d.TradeType === 'Import').reduce((s, d) => s + (d.TradeValue || 0), 0)
    const stateCount = new Set(filtered.map((d) => d.State).filter(Boolean)).size
    return { total, exports, imports, stateCount }
  }, [filtered])

  const topStates = useMemo(() => {
    const byState = new Map()
    filtered.forEach((d) => {
      if (!d.State) return
      if (!byState.has(d.State)) byState.set(d.State, 0)
      byState.set(d.State, byState.get(d.State) + (d.TradeValue || 0))
    })
    return Array.from(byState, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const stateTrends = useMemo(() => {
    const top5 = topStates.slice(0, 5).map((d) => d.label)
    const byStateYear = new Map()
    btsUsState?.forEach((d) => {
      if (!top5.includes(d.State)) return
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return
      const key = `${d.State}|${d.Year}`
      if (!byStateYear.has(key)) byStateYear.set(key, { year: d.Year, State: d.State, value: 0 })
      byStateYear.get(key).value += d.TradeValue || 0
    })
    return Array.from(byStateYear.values())
  }, [btsUsState, topStates, tradeTypeFilter, modeFilter])

  const tableData = useMemo(() => {
    return topStates.map((d) => {
      const stateRows = filtered.filter((r) => r.State === d.label)
      const exp = stateRows.filter((r) => r.TradeType === 'Export').reduce((s, r) => s + (r.TradeValue || 0), 0)
      const imp = stateRows.filter((r) => r.TradeType === 'Import').reduce((s, r) => s + (r.TradeValue || 0), 0)
      return { State: d.label, TotalTrade: d.value, Exports: exp, Imports: imp, Balance: exp - imp }
    })
  }, [topStates, filtered])

  const resetFilters = () => {
    setYearFilter([])
    setTradeTypeFilter('')
    setModeFilter([])
  }

  const activeTags = [
    ...yearFilter.map((y) => ({ group: 'Year', label: y, onRemove: () => setYearFilter(yearFilter.filter((v) => v !== y)) })),
    ...(tradeTypeFilter ? [{ group: 'Trade Type', label: tradeTypeFilter, onRemove: () => setTradeTypeFilter('') }] : []),
    ...modeFilter.map((m) => ({ group: 'Mode', label: m, onRemove: () => setModeFilter(modeFilter.filter((v) => v !== m)) })),
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
      <FilterMultiSelect label="Mode" value={modeFilter} onChange={setModeFilter}
        options={modes} />
    </>
  )

  return (
    <>
      <PageHeader
        title="U.S. Trade by State"
        subtitle="State-level trade flows between the United States and Mexico"
        breadcrumbs={[{ label: 'Overview', path: '/' }, { label: 'Trade by State' }]}
      />

      <DashboardLayout filters={filterPanel} onResetAll={resetFilters} activeCount={activeFilters} activeTags={activeTags}>
        <SectionBlock>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Trade" value={formatCurrency(stats.total)} icon={DollarSign} highlight variant="primary" delay={0} />
            <StatCard label="Total Exports" value={formatCurrency(stats.exports)} icon={ArrowUpRight} delay={100} />
            <StatCard label="Total Imports" value={formatCurrency(stats.imports)} icon={ArrowDownLeft} delay={200} />
            <StatCard label="States" value={String(stats.stateCount)} icon={MapIcon} delay={300} />
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Trade by State" subtitle="Ranked by total trade volume"
              downloadData={{ summary: { data: topStates.slice(0, 15), filename: 'trade-by-state-summary' }, detail: { data: filtered, filename: 'trade-by-state-detail' } }}>
              <BarChart data={topStates.slice(0, 15)} xKey="label" yKey="value" horizontal />
            </ChartCard>
            <ChartCard title="U.S.-Mexico Trade Map" subtitle="Geographic distribution">
              <MapPlaceholder title="State Trade Volume Map" height={360} />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock>
          <ChartCard title="Top 5 State Trends" subtitle="Trade volume over time for the top 5 trading states"
            downloadData={{ summary: { data: stateTrends, filename: 'state-trends-summary' }, detail: { data: filtered, filename: 'state-trends-detail' } }}>
            <LineChart data={stateTrends} xKey="year" yKey="value" seriesKey="State" />
          </ChartCard>
        </SectionBlock>

        <SectionBlock alt>
          <ChartCard title="State Trade Details" subtitle={`${tableData.length} states`}
            className="w-full mx-auto"
            downloadData={{ summary: { data: tableData, filename: 'state-details-summary' }, detail: { data: filtered, filename: 'state-details' } }}>
            <DataTable
              columns={[
                { key: 'State', label: 'State' },
                { key: 'TotalTrade', label: 'Total Trade', render: (v) => formatCurrency(v) },
                { key: 'Exports', label: 'Exports', render: (v) => formatCurrency(v) },
                { key: 'Imports', label: 'Imports', render: (v) => formatCurrency(v) },
                {
                  key: 'Balance', label: 'Balance',
                  render: (v) => (
                    <span className={v >= 0 ? 'text-brand-green' : 'text-brand-red'}>
                      {v >= 0 ? '+' : ''}{formatCurrency(v)}
                    </span>
                  ),
                },
              ]}
              data={tableData}
            />
          </ChartCard>
        </SectionBlock>
      </DashboardLayout>
    </>
  )
}
