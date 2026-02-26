/**
 * ── BORDER PORTS PAGE (Texas Border Port of Entry Analysis) ─────────────
 *
 * Texas border port analysis page that renders:
 *   - PageHeader with breadcrumbs
 *   - KPI stat cards (total port trade, exports, imports, port count)
 *   - Horizontal bar chart — ports ranked by trade volume
 *   - Map placeholder — reserved for a future point map of port locations
 *   - Donut chart — trade by border region
 *   - Bar chart — top commodity groups at border ports
 *   - Line chart — top 5 port trends over time
 *   - DataTable — port detail with region, export/import breakdown
 *
 * Filters (in right sidebar via DashboardLayout + FilterSidebar):
 *   - Year        (multi-select)
 *   - Trade Type  (single-select: Export / Import)
 *   - Mode        (multi-select)
 *   - Region      (single-select — unique to this page)
 *
 * Dataset used:
 *   - txBorderPorts — columns: Year, POE, Region, Mode, CommodityGroup,
 *                     Commodity, TradeType, TradeValue, Lat, Lon
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * 1. Change the dataset import from useTradeStore to match your new data
 * 2. Update the useMemo calculations to aggregate your data columns
 * 3. Update filter options to match your data's filterable fields
 * 4. Update chart props (xKey, yKey, seriesKey, etc.) to match your columns
 * 5. Update DataTable column definitions
 * 6. Update StatCard labels and calculations
 *
 * This page demonstrates a location-oriented breakdown with the most
 * filters (4 filter controls). It also shows how to add an extra
 * single-select filter (Region) beyond the standard Year/TradeType/Mode set.
 * The Lat/Lon columns in the dataset are available for a real map component.
 *
 * Key customization points:
 *   - "portData" useMemo         — Aggregation for the bar chart
 *   - "regionData" useMemo       — Aggregation for the donut chart
 *   - "topCommodities" useMemo   — Secondary breakdown aggregation
 *   - "portTrends" useMemo       — Time-series for the line chart
 *   - "tableData" useMemo        — Row calculations for the DataTable
 *   - "regionFilter" state       — Example of an additional filter dimension
 *   - MapPlaceholder             — Replace with a real map component (e.g., ChoroplethMap)
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
import DonutChart from '@/components/charts/DonutChart'
import { formatCurrency } from '@/lib/chartColors'
import { Building2, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function BorderPortsPage() {
  const { txBorderPorts, loading } = useTradeStore()
  const [yearFilter, setYearFilter] = useState([])
  const [tradeTypeFilter, setTradeTypeFilter] = useState('')
  const [modeFilter, setModeFilter] = useState([])
  const [regionFilter, setRegionFilter] = useState('')

  // REQUIRED COLUMNS for this page:
  // Year, TradeType, Mode, Region, POE, CommodityGroup, TradeValue.
  // Lat/Lon are optional right now (reserved for a future map implementation).

  const years = useMemo(() => {
    if (!txBorderPorts) return []
    return [...new Set(
      txBorderPorts
        .map((d) => Number(d.Year))
        .filter((y) => Number.isFinite(y)),
    )].sort((a, b) => b - a)
  }, [txBorderPorts])

  const modes = useMemo(() => {
    if (!txBorderPorts) return []
    return [...new Set(txBorderPorts.map((d) => d.Mode))].filter(Boolean).sort()
  }, [txBorderPorts])

  const regions = useMemo(() => {
    if (!txBorderPorts) return []
    return [...new Set(txBorderPorts.map((d) => d.Region))].filter(Boolean).sort()
  }, [txBorderPorts])

  const filtered = useMemo(() => {
    if (!txBorderPorts) return []
    return txBorderPorts.filter((d) => {
      // yearFilter stores string values because FilterMultiSelect emits string options.
      if (yearFilter.length > 0 && !yearFilter.includes(String(d.Year))) return false
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return false
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return false
      if (regionFilter && d.Region !== regionFilter) return false
      return true
    })
  }, [txBorderPorts, yearFilter, tradeTypeFilter, modeFilter, regionFilter])

  const activeFilters = [yearFilter.length > 0, tradeTypeFilter, modeFilter.length > 0, regionFilter].filter(Boolean).length

  const stats = useMemo(() => {
    const total = filtered.reduce((s, d) => s + (d.TradeValue || 0), 0)
    const exports = filtered.filter((d) => d.TradeType === 'Export').reduce((s, d) => s + (d.TradeValue || 0), 0)
    const imports = filtered.filter((d) => d.TradeType === 'Import').reduce((s, d) => s + (d.TradeValue || 0), 0)
    const portCount = new Set(filtered.map((d) => d.POE).filter(Boolean)).size
    return { total, exports, imports, portCount }
  }, [filtered])

  const portData = useMemo(() => {
    const byPort = new Map()
    filtered.forEach((d) => {
      const p = d.POE
      if (!p) return
      if (!byPort.has(p)) byPort.set(p, 0)
      byPort.set(p, byPort.get(p) + (d.TradeValue || 0))
    })
    return Array.from(byPort, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const regionData = useMemo(() => {
    const byRegion = new Map()
    filtered.forEach((d) => {
      if (!d.Region) return
      if (!byRegion.has(d.Region)) byRegion.set(d.Region, 0)
      byRegion.set(d.Region, byRegion.get(d.Region) + (d.TradeValue || 0))
    })
    return Array.from(byRegion, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const portTrends = useMemo(() => {
    if (!txBorderPorts) return []
    const topPorts = portData.slice(0, 5).map((d) => d.label)
    const byPortYear = new Map()
    txBorderPorts.forEach((d) => {
      if (!topPorts.includes(d.POE)) return
      if (tradeTypeFilter && d.TradeType !== tradeTypeFilter) return
      if (modeFilter.length > 0 && !modeFilter.includes(d.Mode)) return
      if (regionFilter && d.Region !== regionFilter) return
      const key = `${d.POE}|${d.Year}`
      if (!byPortYear.has(key)) byPortYear.set(key, { year: d.Year, Port: d.POE, value: 0 })
      byPortYear.get(key).value += d.TradeValue || 0
    })
    return Array.from(byPortYear.values())
  }, [txBorderPorts, portData, tradeTypeFilter, modeFilter, regionFilter])

  const topCommodities = useMemo(() => {
    const byCom = new Map()
    filtered.forEach((d) => {
      const c = d.CommodityGroup
      if (!c) return
      if (!byCom.has(c)) byCom.set(c, 0)
      byCom.set(c, byCom.get(c) + (d.TradeValue || 0))
    })
    return Array.from(byCom, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filtered])

  const tableData = useMemo(() => {
    return portData.map((d) => {
      const rows = filtered.filter((r) => r.POE === d.label)
      const exp = rows.filter((r) => r.TradeType === 'Export').reduce((s, r) => s + (r.TradeValue || 0), 0)
      const imp = rows.filter((r) => r.TradeType === 'Import').reduce((s, r) => s + (r.TradeValue || 0), 0)
      const region = rows[0]?.Region || ''
      return { Port: d.label, Region: region, Total: d.value, Exports: exp, Imports: imp }
    })
  }, [portData, filtered])

  const resetFilters = () => {
    setYearFilter([])
    setTradeTypeFilter('')
    setModeFilter([])
    setRegionFilter('')
  }

  const activeTags = [
    ...yearFilter.map((y) => ({ group: 'Year', label: y, onRemove: () => setYearFilter(yearFilter.filter((v) => v !== y)) })),
    ...(tradeTypeFilter ? [{ group: 'Trade Type', label: tradeTypeFilter, onRemove: () => setTradeTypeFilter('') }] : []),
    ...modeFilter.map((m) => ({ group: 'Mode', label: m, onRemove: () => setModeFilter(modeFilter.filter((v) => v !== m)) })),
    ...(regionFilter ? [{ group: 'Region', label: regionFilter, onRemove: () => setRegionFilter('') }] : []),
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
      <FilterSelect label="Region" value={regionFilter} onChange={setRegionFilter}
        options={regions} />
    </>
  )

  return (
    <>
      <PageHeader
        title="Texas Border Ports of Entry"
        subtitle="Trade activity at Texas-Mexico land ports of entry"
        breadcrumbs={[{ label: 'Overview', path: '/' }, { label: 'TX Border Ports' }]}
      />

      <DashboardLayout filters={filterPanel} onResetAll={resetFilters} activeCount={activeFilters} activeTags={activeTags}>
        <SectionBlock>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Port Trade" value={formatCurrency(stats.total)} icon={DollarSign} highlight variant="primary" delay={0} />
            <StatCard label="Exports" value={formatCurrency(stats.exports)} icon={ArrowUpRight} delay={100} />
            <StatCard label="Imports" value={formatCurrency(stats.imports)} icon={ArrowDownLeft} delay={200} />
            <StatCard label="Ports of Entry" value={String(stats.portCount)} icon={Building2} delay={300} />
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Trade by Port of Entry" subtitle="Ranked by total value"
              downloadData={{ summary: { data: portData, filename: 'port-trade-summary' }, detail: { data: filtered, filename: 'port-trade-detail' } }}>
              <BarChart data={portData} xKey="label" yKey="value" horizontal />
            </ChartCard>
            <ChartCard title="Border Ports Map" subtitle="Texas-Mexico border crossings">
              <MapPlaceholder title="Border Ports Map" height={360} />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Trade by Region" subtitle="Grouped by border region"
              downloadData={{ summary: { data: regionData, filename: 'port-region-summary' }, detail: { data: filtered, filename: 'port-region-detail' } }}>
              <DonutChart data={regionData} />
            </ChartCard>
            <ChartCard title="Top Commodity Groups" subtitle="Most traded commodities at border ports"
              downloadData={{ summary: { data: topCommodities, filename: 'port-commodities-summary' }, detail: { data: filtered, filename: 'port-commodities-detail' } }}>
              <BarChart data={topCommodities} xKey="label" yKey="value" horizontal />
            </ChartCard>
          </div>
        </SectionBlock>

        <SectionBlock alt>
          <ChartCard title="Port Trends Over Time" subtitle="Top 5 ports, annual trade volume"
            downloadData={{ summary: { data: portTrends, filename: 'port-trends-summary' }, detail: { data: filtered, filename: 'port-trends-detail' } }}>
            <LineChart data={portTrends} xKey="year" yKey="value" seriesKey="Port" />
          </ChartCard>
        </SectionBlock>

        <SectionBlock>
          <ChartCard title="Port Detail" subtitle={`${tableData.length} ports of entry`}
            className=""
            downloadData={{ summary: { data: tableData, filename: 'port-detail-summary' }, detail: { data: filtered, filename: 'port-detail' } }}>
            <DataTable
              columns={[
                { key: 'Port', label: 'Port of Entry' },
                { key: 'Region', label: 'Region' },
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
