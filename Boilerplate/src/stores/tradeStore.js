/**
 * ── tradeStore.js ───────────────────────────────────────────────────────────
 * Central Zustand store that loads CSV datasets, normalizes column names,
 * and provides global filter state used by every page.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ██  BOILERPLATE: HOW TO ADAPT FOR A NEW PROJECT                         ██
 * ════════════════════════════════════════════════════════════════════════════
 *
 * When reusing this dashboard with a different dataset, make changes in
 * the numbered sections below:
 *
 * ── STEP 1: Replace CSV files ──────────────────────────────────────────────
 * Place your new CSV files in `public/data/`. Then update the `loadData()`
 * method to load them. You can have 1–N datasets; just add/remove lines in
 * the `Promise.all` block.
 *
 * ── STEP 2: Update state properties ────────────────────────────────────────
 * Rename the state properties (e.g. `usAggregated`, `txBorderPorts`) to
 * match your dataset semantics (e.g. `salesData`, `inventoryData`).
 * Update every page component that imports from this store.
 *
 * ── STEP 3: Update the normalize() function ────────────────────────────────
 * The normalize function renames CSV columns with spaces to camelCase and
 * coerces numeric values. Adapt it to match YOUR CSV column names:
 *   - Rename columns: `d.MyColumn = d['My Column']; delete d['My Column']`
 *   - Coerce numbers: `d.Amount = +d.Amount || 0`
 *   - Parse dates:    `d.Date = new Date(d.Date)`
 *
 * ── STEP 4: Update the filters object ──────────────────────────────────────
 * Add/remove filter keys to match the filterable columns in your new data.
 * Then update each page's filter UI (FilterSelect/FilterMultiSelect) and
 * the `filtered` useMemo in each page to apply the new filter keys.
 *
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ── CURRENT DATASETS (for reference) ───────────────────────────────────────
 * - usAggregated:  /data/us_aggregated.csv  (Year, State, Commodity, Mode, CommodityGroup, TradeType, TradeValue)
 * - txBorderPorts: /data/tx_border_ports.csv (Year, POE, Region, Mode, CommodityGroup, Commodity, TradeType, TradeValue, Lat, Lon)
 * - btsUsState:    /data/bts_us_state.csv    (State, StateCode, Year, TradeType, Mode, TradeValue)
 * - masterData:    /data/master_data.csv     (Port, IsTXBorder, State, Region, Year, TradeType, CommodityGroup, Mode, TradeValue)
 *
 * ────────────────────────────────────────────────────────────────────────────
 */
import { create } from 'zustand'
import * as d3 from 'd3'

/**
 * Parse loose numeric strings safely.
 * Supports values like "$1,234,567.89" and falls back to 0 for invalid input.
 */
function parseLooseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '').trim()
    if (!cleaned) return 0
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

/**
 * Parse a year from number/string values.
 * Returns null when no valid year can be extracted.
 */
function parseLooseYear(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const direct = Number(trimmed)
    if (Number.isFinite(direct)) return Math.trunc(direct)
    const match = trimmed.match(/\d{4}/)
    if (match) return Number(match[0])
  }
  return null
}

/** Trim strings and collapse empty strings to null for cleaner filtering. */
function normalizeText(value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

/** Build a sampled key set so missing-column warnings survive sparse rows. */
function collectColumns(rows, sampleSize = 200) {
  const keys = new Set()
  rows.slice(0, sampleSize).forEach((row) => {
    if (!row || typeof row !== 'object') return
    Object.keys(row).forEach((k) => keys.add(k))
  })
  return keys
}

/**
 * Warn (non-fatal) when incoming datasets don't match expected schema.
 * This helps future agents quickly see where adaptation is required.
 */
function warnIfMissingColumns(datasetName, rows, requiredColumns) {
  if (!rows?.length) {
    console.warn(
      `[tradeStore] ${datasetName} is empty. Charts/tables will render empty states until data is provided.`,
    )
    return
  }
  const keys = collectColumns(rows)
  const missing = requiredColumns.filter((col) => !keys.has(col))
  if (missing.length > 0) {
    console.warn(
      `[tradeStore] ${datasetName} missing expected columns: ${missing.join(', ')}. ` +
      'Update tradeStore normalization and page mappings for the new schema.',
    )
  }
}

export const useTradeStore = create((set) => ({
  // ── STEP 2: Dataset state properties ──────────────────────────────────
  // Each property holds a parsed CSV array (or null before loading).
  // Rename these to match your project's datasets.
  usAggregated: null,
  txBorderPorts: null,
  btsUsState: null,
  masterData: null,

  // Loading / error state (used by pages to show spinner or error UI)
  loading: true,
  error: null,

  // ── STEP 4: Filter state ──────────────────────────────────────────────
  // Each key maps to a filterable column. Empty string = "All" (no filter).
  // For multi-select filters, pages use local state (arrays) instead.
  filters: {
    year: '',
    tradeType: '',
    mode: '',
    state: '',
    commodityGroup: '',
    port: '',
  },

  /** Update a single filter key. Used by FilterSelect components. */
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))
  },

  /** Reset all filters to empty (= "All"). */
  resetFilters: () => {
    set({
      filters: { year: '', tradeType: '', mode: '', state: '', commodityGroup: '', port: '' },
    })
  },

  /**
   * Load all CSV datasets, normalize column names, and store in state.
   * Called once on app mount from App.jsx.
   *
   * ── STEP 1: Replace the CSV file paths and variable names here ────────
   */
  loadData: async () => {
    set({ loading: true, error: null })
    try {
      const base = import.meta.env.BASE_URL
      const [usAgg, txPorts, usState, master] = await Promise.all([
        d3.csv(`${base}data/us_aggregated.csv`, d3.autoType),
        d3.csv(`${base}data/tx_border_ports.csv`, d3.autoType),
        d3.csv(`${base}data/bts_us_state.csv`, d3.autoType),
        d3.csv(`${base}data/master_data.csv`, d3.autoType),
      ])

      // ── STEP 3: Column normalization ────────────────────────────────────
      // Renames columns with spaces → camelCase and coerces numbers.
      // Adapt this function to match your CSV's actual column headers.
      const normalize = (d) => {
        // Map spaced column names to the camelCase schema used by page components.
        if ('Trade Value' in d) {
          d.TradeValue = d['Trade Value']
          delete d['Trade Value']
        }
        if ('Trade Type' in d) {
          d.TradeType = d['Trade Type']
          delete d['Trade Type']
        }
        if ('Commodity Group' in d) {
          d.CommodityGroup = d['Commodity Group']
          delete d['Commodity Group']
        }
        if ('Port of Entry' in d && !('POE' in d)) {
          d.POE = d['Port of Entry']
          delete d['Port of Entry']
        }

        // Coerce core numeric fields with loose parsing for common CSV formatting.
        d.Year = parseLooseYear(d.Year)
        d.TradeValue = parseLooseNumber(d.TradeValue)

        // Normalize common string fields used by filters, grouping, and labels.
        ;[
          'TradeType',
          'CommodityGroup',
          'Mode',
          'State',
          'POE',
          'Region',
          'Commodity',
          'Port',
        ].forEach((key) => {
          if (key in d) d[key] = normalizeText(d[key])
        })

        return d
      }

      usAgg.forEach(normalize)
      txPorts.forEach(normalize)
      usState.forEach(normalize)
      master.forEach(normalize)

      // Schema checks are warnings only, so dashboards still load while adapting.
      warnIfMissingColumns('usAggregated', usAgg, ['Year', 'TradeType', 'TradeValue'])
      warnIfMissingColumns('txBorderPorts', txPorts, [
        'Year', 'POE', 'Region', 'Mode', 'TradeType', 'TradeValue',
      ])
      warnIfMissingColumns('btsUsState', usState, [
        'Year', 'State', 'Mode', 'TradeType', 'TradeValue',
      ])
      warnIfMissingColumns('masterData', master, ['Year', 'TradeType', 'TradeValue'])

      // ── STEP 2 (continued): Store the loaded datasets ─────────────────
      set({
        usAggregated: usAgg,
        txBorderPorts: txPorts,
        btsUsState: usState,
        masterData: master,
        loading: false,
      })
    } catch (err) {
      console.error('Failed to load data:', err)
      set({ error: err.message, loading: false })
    }
  },
}))
