# Interactive Data Dashboard — References

> Quick links and notes for live examples, design inspiration, and code references.
> Stack focus: D3.js + Crossfilter for linked interactive visualizations.

---

## Category 1: Finished Dashboard Examples (Inspiration for Building)

### 1. Square Crossfilter — Flights Explorer
- **URL:** https://square.github.io/crossfilter/
- **Why:** Classic pure data exploration dashboard. 250K flight records. Entire page is
  interactive coordinated charts and a data table. Zero non-dashboard content. Built with
  D3 + Crossfilter — exactly the target stack.
- **Key patterns:** Four coordinated bar charts, brush-and-drag cross-filtering (<30ms updates),
  detail table, record count indicator ("X of 231,083 flights selected").

### 2. DC.js Nasdaq Dashboard
- **URL:** https://dc-js.github.io/dc.js/
- **Why:** Multi-chart analytical dashboard analyzing 27 years of Nasdaq data. Six linked
  visualizations with crossfilter interactivity. Feels like a financial analytics application.
- **Key patterns:** Bubble chart + bar charts + line/area chart all cross-linked,
  per-chart reset buttons, record count display, zoomable time-series.

### 3. Divvy Bike Share Crossfilter Dashboard
- **URL:** http://albertlyu.github.io/divvy-crossfilter/
- **Source:** https://github.com/albertlyu/divvy-crossfilter
- **Why:** Single-purpose data exploration dashboard for Chicago's Divvy bike share.
  750K+ trip records. D3 + dc.js + Crossfilter — the classic open-source dashboard stack.
- **Key patterns:** Multiple coordinated bar charts, brush-and-drag cross-filtering,
  record count indicator, dense analytical layout.

### 4. Plotly Dash App Examples
- **URL:** https://plotly.com/examples/
- **Why:** Live running dashboard apps (not screenshots). Covers Uber ride pickups,
  financial analytics, medical data. Actual deployed applications.
- **Key patterns:** Sidebar/top-bar nav, interactive Plotly charts (hover, zoom, select),
  callback-driven cross-updates, dropdown/slider/date-picker filters, map + chart combos.

### 5. Klipfolio Live Dashboards
- **URL:** https://www.klipfolio.com/live-dashboards
- **Why:** Real operational dashboards displayed on office walls. 90+ interactive examples
  organized by department (Marketing, Sales, Finance, UX, Executive).
- **Key patterns:** Full-screen TV-mode layout, KPI tiles with sparklines and trend arrows,
  dense information layout, department-based navigation, threshold color coding.

### 6. Redash (Open-Source Dashboard Platform)
- **URL:** https://redash.io/
- **Source:** https://github.com/getredash/redash
- **Why:** Open-source SQL → dashboard tool. Online demo available without signup.
  Clean, no-nonsense BI tool feel.
- **Key patterns:** Top nav (Dashboards, Queries, Alerts), draggable/resizable widgets,
  SQL query editor, dashboard-level filters and parameters, scheduled refresh.

---

## Category 2: Code References

### 7. D3 Official Gallery
- **URL:** https://observablehq.com/@d3/gallery

### 8. Crossfilter GitHub
- **URL:** https://github.com/crossfilter/crossfilter

### 9. Shadcn/ui Dashboard Example
- **URL:** https://ui.shadcn.com/examples/dashboard
- **Use for:** UI shell only — sidebar, filter controls. D3 charts go in the content area.

### 10. Observable Framework Examples
- **URL:** https://observablehq.com/framework/examples

---

## Reference URLs — Quick List

```
# Category 1: Finished Dashboard Examples
https://square.github.io/crossfilter/
https://dc-js.github.io/dc.js/
http://albertlyu.github.io/divvy-crossfilter/
https://plotly.com/examples/
https://www.klipfolio.com/live-dashboards
https://redash.io/

# Category 2: Code References
https://observablehq.com/@d3/gallery
https://github.com/crossfilter/crossfilter
https://ui.shadcn.com/examples/dashboard
https://observablehq.com/framework/examples
```
