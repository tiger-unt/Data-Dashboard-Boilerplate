/**
 * ── TRADE BY COMMODITY PAGE ─────────────────────────────────────────────
 *
 * Commodity-level trade analysis page that renders:
 *   - PageHeader with breadcrumbs
 *   - KPI stat cards (total trade value, commodity group count, individual commodity count)
 *   - Treemap chart — commodity groups sized by trade value (top 12)
 *   - Horizontal bar chart — top 10 individual commodities by trade value
 *   - Line chart — top 5 commodity group trends over time
 *   - DataTable — top commodities with export/import breakdown
 *
 * Filters (in right sidebar via DashboardLayout + FilterSidebar):
 *   - Year        (multi-select)
 *   - Trade Type  (single-select: Export / Import)
 *   - Mode        (multi-select)
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
 * This page demonstrates the treemap + bar + line + table pattern.
 * The treemap is useful for showing hierarchical or categorical breakdowns
 * where relative size matters (e.g., commodity groups, product categories).
 *
 * Key customization points:
 *   - "commodityGroups" useMemo  — Aggregation for the treemap
 *   - "topCommodities" useMemo   — Aggregation for the bar chart
 *   - "groupTrends" useMemo      — Aggregation for the line chart
 *   - "tableData" useMemo        — Row calculations for the DataTable
 *   - TreemapChart data prop     — Expects array of { label, value }
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
import BarChart from '@/components/charts/BarChart'
import TreemapChart from '@/components/charts/TreemapChart'
import LineChart from '@/components/charts/LineChart'
import { formatCurrency } from '@/lib/chartColors'
import { Package, TrendingUp } from 'lucide-react'

export default function TradeByCommodityPage() {
  const { usAggregated, loading } = useTradeStore()
  const [yearFilter, setYearFilter] = useState([])
  const [tradeTypeFilter, setTradeTypeFilter] = useState('')
  const [modeFilter, setModeFilter] = useState([])

  // REQUIRED COLUMNS for this page: Year, TradeType, Mode, CommodityGroup, Commodity, TradeValue.
  // If a new dataset uses different names, update the mapping in tradeStore + these useMemo blocks.

  const years = useMemo(() => {
    if (!usAggregated) return []
    return [...new Set(
      usAggregated
        .map((d) => Number(d.Year))
        .filter((y) => Number.isFinite(y)),
    )].sort((a, b) => b - a)
  }, [usAggregated])

  const modes = useMemo(() => {
    if (!usAggregated) return []
    return [...new Set(usAggregated.map((d) => d.Mode))].filter(Boolean).sort()
  }, [usAggregated])

  const filtered = useMemo(() => {
    if (!usAggregated) return []
    return usAggregated.filter((d) => {
      if (yearFilter.length > 0 && !yearFilter.includes(String(d.Year))) return false
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return false
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return false
      return true
    })
  }, [usAggregated, yearFilter, tradeTypeFilter, modeFilter])

  const activeFilters = [yearFilter.length > 0, tradeTypeFilter, modeFilter.length > 0].filter(Boolean).length

  const stats = useMemo(() => {
    const total = filtered.reduce((s, d) => s + (d.TradeValue || 0), 0)
    const groups = new Set(filtered.map((d) => d.CommodityGroup).filter(Boolean)).size
    const commodities = new Set(filtered.map((d) => d.Commodity).filter(Boolean)).size
    return { total, groups, commodities }
  }, [filtered])

  const commodityGroups = useMemo(() => {
    const byGroup = new Map()
    filtered.forEach((d) => {
      // Missing CommodityGroup values are skipped to avoid unlabeled treemap nodes.
      const g = d.CommodityGroup
      if (!g) return
      if (!byGroup.has(g)) byGroup.set(g, 0)
      byGroup.set(g, byGroup.get(g) + (d.TradeValue || 0))
    })
    return Array.from(byGroup, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const topCommodities = useMemo(() => {
    const byCom = new Map()
    filtered.forEach((d) => {
      const c = d.Commodity
      if (!c) return
      if (!byCom.has(c)) byCom.set(c, 0)
      byCom.set(c, byCom.get(c) + (d.TradeValue || 0))
    })
    return Array.from(byCom, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15)
  }, [filtered])

  const groupTrends = useMemo(() => {
    if (!usAggregated) return []
    const top5 = commodityGroups.slice(0, 5).map((d) => d.label)
    const byGroupYear = new Map()
    usAggregated.forEach((d) => {
      const g = d.CommodityGroup
      if (!top5.includes(g)) return
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return
      const key = `${g}|${d.Year}`
      if (!byGroupYear.has(key)) byGroupYear.set(key, { year: d.Year, CommodityGroup: g, value: 0 })
      byGroupYear.get(key).value += d.TradeValue || 0
    })
    return Array.from(byGroupYear.values())
  }, [usAggregated, commodityGroups, tradeTypeFilter, modeFilter])

  const tableData = useMemo(() => {
    return topCommodities.map((d) => {
      const rows = filtered.filter((r) => r.Commodity === d.label)
      const exp = rows.filter((r) => r.TradeType === 'Export').reduce((s, r) => s + (r.TradeValue || 0), 0)
      const imp = rows.filter((r) => r.TradeType === 'Import').reduce((s, r) => s + (r.TradeValue || 0), 0)
      return { Commodity: d.label, Total: d.value, Exports: exp, Imports: imp }
    })
  }, [topCommodities, filtered])

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
        title="Trade by Commodity"
        subtitle="Commodity group and product-level trade analysis"
        breadcrumbs={[{ label: 'Overview', path: '/' }, { label: 'Commodities' }]}
      />

      <DashboardLayout filters={filterPanel} onResetAll={resetFilters} activeCount={activeFilters} activeTags={activeTags}>
        <SectionBlock>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Trade Value" value={formatCurrency(stats.total)} icon={TrendingUp} highlight variant="primary" delay={0} />
            <StatCard label="Commodity Groups" value={String(stats.groups)} icon={Package} delay={100} />
            <StatCard label="Individual Commodities" value={String(stats.commodities)} icon={Package} delay={200} />
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Commodity Groups" subtitle="Trade value by HS classification group"
              downloadData={{ summary: { data: commodityGroups.slice(0, 12), filename: 'commodity-groups-summary' }, detail: { data: filtered, filename: 'commodity-groups-detail' } }}>
              <TreemapChart data={commodityGroups.slice(0, 12)} />
            </ChartCard>
            <ChartCard title="Top Commodities" subtitle="Highest value individual commodities"
              downloadData={{ summary: { data: topCommodities.slice(0, 10), filename: 'top-commodities-summary' }, detail: { data: filtered, filename: 'top-commodities-detail' } }}>
              <BarChart data={topCommodities.slice(0, 10)} xKey="label" yKey="value" horizontal />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock>
          <ChartCard title="Top 5 Commodity Group Trends" subtitle="Trade value by year"
            downloadData={{ summary: { data: groupTrends, filename: 'commodity-trends-summary' }, detail: { data: filtered, filename: 'commodity-trends-detail' } }}>
            <LineChart data={groupTrends} xKey="year" yKey="value" seriesKey="CommodityGroup" />
          </ChartCard>
        </SectionBlock>

        <SectionBlock alt>
          <ChartCard title="Commodity Detail" subtitle={`Top ${tableData.length} commodities`}
            className="w-full mx-auto"
            downloadData={{ summary: { data: tableData, filename: 'commodity-detail-summary' }, detail: { data: filtered, filename: 'commodity-detail' } }}>
            <DataTable
              columns={[
                { key: 'Commodity', label: 'Commodity' },
                { key: 'Total', label: 'Total Trade', render: (v) => formatCurrency(v) },
                { key: 'Exports', label: 'Exports', render: (v) => formatCurrency(v) },
                { key: 'Imports', label: 'Imports', render: (v) => formatCurrency(v) },
              ]}
              data={tableData}
            />
          </ChartCard>
        </SectionBlock>
      </DashboardLayout>
    </>
  )
}
