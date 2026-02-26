# Interactive Data Dashboard — Build Plan

> For migrating from Tableau to a self-hosted, vibe-coded web app with linked interactive
> visualizations, sidebar navigation, and cross-filtering controls.
> **Stack choice: D3.js + Crossfilter — full control, future-proof, no ceilings.**
> **Client: TxDOT (Texas Department of Transportation)**

---

## How This Works — Two-Layer Structure

```
boilerplate/                  ← TxDOT-branded design system (build this first)
  ├── design-tokens           ← Colors, fonts, spacing, shadows
  ├── components              ← Header, nav, cards, buttons, filter controls
  └── layout shell            ← Page structure, routing, empty chart containers

    ↓ clone for each new project

project-a/                    ← Point to boilerplate, add data + D3 charts
project-b/                    ← Point to boilerplate, add data + D3 charts
project-c/                    ← Point to boilerplate, add data + D3 charts
```

The boilerplate is built **once** and stays TxDOT-branded. Each project clones it and
fills in data and charts without touching the theme.

---

## Part 1 — Boilerplate / Design System

### TxDOT Brand Tokens
> Extracted from the TxDOT Bridge WebApp reference project.
> These go directly into the Tailwind config and CSS variables.

```js
// TxDOT BRAND — extracted from official brand guidelines & reference project
const brand = {

  // --- PRIMARY COLORS ---
  primary:        "#0056a9",   // TxDOT Blue — main buttons, active nav, key highlights
  primaryDark:    "#002e69",   // Dark Blue — hover states, gradients, nav active bg
  white:          "#ffffff",
  red:            "#d90d0d",   // Red — accent only (sparingly)

  // --- SECONDARY COLORS (accessible on white backgrounds) ---
  darkGreen:      "#196533",
  darkPurple:     "#5f0f40",
  darkGray:       "#333f48",   // Primary text color

  // --- SECONDARY COLORS (accessible on dark backgrounds) ---
  lightBrown:     "#c5bbaa",
  lightGray:      "#dadee5",   // Utility bar & footer background
  lightYellow:    "#f2ce1b",
  lightOrange:    "#df5c16",
  lightGreen:     "#8ec02d",

  // --- NEUTRALS ---
  background:     "#ffffff",   // Page background
  backgroundAlt:  "#f5f7f9",   // Alternating section background
  backgroundDark: "#333f48",   // Dark sections (e.g., CTA bands)
  surface:        "#ffffff",   // Card/panel background
  border:         "#d1d5db",   // Dividers, card borders
  borderLight:    "#e5e7eb",   // Subtle separators
  textPrimary:    "#333f48",   // Headings and body text
  textSecondary:  "#5a6872",   // Subtitles, labels, muted text
  textInverse:    "#ffffff",   // Text on dark backgrounds

  // --- TYPOGRAPHY ---
  fontPrimary:    "'IBM Plex Sans', Verdana, Aptos, Arial, sans-serif",
  fontCondensed:  "'IBM Plex Sans Condensed', Verdana, Arial, sans-serif",
  fontMono:       "'IBM Plex Mono', 'JetBrains Mono', monospace",
  // Google Fonts import:
  // https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap
  // Weights used: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

  // --- LOGO ---
  logoPath:       "/assets/TxDOT-Logo-Vertical-RGB.svg",
  logoPathBlue:   "/assets/TxDOT-Logo-Vertical-RGB-Blue.svg",
  logoWidth:      "80px",    // Header logo width
  logoWidthSm:    "60px",    // Mobile logo width
  logoWidthFooter: "50px",   // Footer logo width

  // --- GRADIENT ---
  gradientBlue:   "linear-gradient(135deg, #0056a9 0%, #002e69 100%)",

  // --- D3 CHART COLOR PALETTE ---
  // Ordered list for chart series — drawn from TxDOT brand palette
  chartColors: [
    "#0056a9",  // TxDOT Blue (primary)
    "#002e69",  // Dark Blue
    "#196533",  // Dark Green
    "#df5c16",  // Light Orange
    "#5f0f40",  // Dark Purple
    "#8ec02d",  // Light Green
    "#f2ce1b",  // Light Yellow
    "#c5bbaa",  // Light Brown
    "#d90d0d",  // Red (accent — use last)
  ],
}
```

---

### TxDOT Page Layout Structure
> Replicate this exact layout hierarchy from the reference project.
> This is a **top-nav government-style layout**, NOT a sidebar dashboard layout.

```
┌────────────────────────────────────────────────────┐
│ UTILITY BAR (light gray #dadee5)                   │
│   Right-aligned: "Contact us »" | Language toggle  │
├────────────────────────────────────────────────────┤
│ SITE HEADER (white background)                     │
│   [TxDOT Logo] | Title + Subtitle    | [Search]   │
├────────────────────────────────────────────────────┤
│ MAIN NAV BAR (TxDOT Blue #0056a9)                  │
│   Home | Page 1 ▾ | Page 2 ▾ | Page 3 ▾ | About   │
│   (white text, dark-blue hover/active states)      │
│   (dropdown panels with title + desc + CTA link)   │
├────────────────────────────────────────────────────┤
│                                                    │
│                 MAIN CONTENT                       │
│   (alternating white / #f5f7f9 sections)           │
│   (stat cards, chart cards, grids, data tables)    │
│                                                    │
├────────────────────────────────────────────────────┤
│ FOOTER (light gray #dadee5)                        │
│   Contact | Quick Links | TxDOT Logo + Link        │
└────────────────────────────────────────────────────┘
```

**Key layout notes:**
- **No sidebar.** Use a top navigation bar matching TxDOT's government website pattern.
- Utility bar sits above the header (thin, light gray strip).
- Main nav is a full-width blue bar with dropdown mega-menus.
- Nav dropdowns contain a title, description paragraph, and CTA link.
- Mobile: hamburger menu, stacked nav items.
- Footer: 3-column grid (Contact, Quick Links, TxDOT link).
- Content sections alternate between white and `#f5f7f9` backgrounds.
- Max container width: `1280px`, centered.

---

### Boilerplate Claude Code Prompt

Use this prompt in a fresh Claude Code session to build the design system shell.

```
I am building a reusable dashboard boilerplate for TxDOT (Texas Department of Transportation).
This session is ONLY about the design system and UI shell — no data, no D3 charts yet.
Charts will be added in separate project sessions that inherit from this boilerplate.

The design must exactly match TxDOT's existing web application theme. Reference files
for the theme are located at:
  C:/Users/UNT/UNT System/TxDOT IAC 2025-26 - General/Task 1 - Bridges and Border Crossings Guide/Task 1.4 - 2026 Bridge WebApp/page-previews/

Read and replicate the CSS variables, component styles, and layout structure from that
reference project. The key files are:
  - css/variables.css  ← all brand tokens (colors, fonts, spacing, shadows, etc.)
  - css/base.css       ← reset, typography, buttons, form elements, tables
  - css/layout.css     ← container, grid, flexbox, spacing utilities, responsive breakpoints
  - css/components.css ← utility bar, site header, main nav, footer, hero, stat cards, etc.
  - home-preview.html  ← full page structure showing the layout hierarchy

Here are the TxDOT brand details:

PRIMARY COLOR:        #0056a9 (TxDOT Blue)
PRIMARY DARK:         #002e69 (gradients, hover states)
ACCENT COLOR:         #d90d0d (red — sparingly)
SECONDARY COLORS:     #196533 (dark green), #5f0f40 (dark purple)
LIGHT PALETTE:        #c5bbaa, #dadee5, #f2ce1b, #df5c16, #8ec02d
BACKGROUND:           #ffffff
BACKGROUND ALT:       #f5f7f9
BACKGROUND DARK:      #333f48
SURFACE (cards):      #ffffff
BORDER:               #d1d5db
BORDER LIGHT:         #e5e7eb
TEXT PRIMARY:          #333f48
TEXT SECONDARY:       #5a6872
TEXT INVERSE:          #ffffff
FONT (all text):      'IBM Plex Sans' (Google Fonts — weights 300,400,500,600,700)
FONT (condensed):     'IBM Plex Sans Condensed'
FONT (mono/data):     'IBM Plex Mono'
GRADIENT:             linear-gradient(135deg, #0056a9, #002e69)
LOGO FILES:           TxDOT-Logo-Vertical-RGB.svg (header)
                      TxDOT-Logo-Vertical-RGB-Blue.svg (footer)
                      (I will place these in /public/assets/Logos/)

Build the following:

1. TAILWIND CONFIG
   - Define all TxDOT brand colors as named Tailwind tokens:
     brand-blue, brand-blue-dark, brand-red, brand-green, brand-purple,
     brand-gray-dark, brand-gray-light, brand-brown, brand-yellow, brand-orange, brand-green-light
   - Set font family: IBM Plex Sans as default, IBM Plex Mono for mono
   - Add custom box-shadow scale matching the reference project
   - Container max-width: 1280px

2. GLOBAL STYLES (CSS variables)
   - Mirror ALL Tailwind tokens as CSS custom properties for D3 chart access
     (D3 cannot read Tailwind classes — colors must exist as --color-* vars)
   - Replicate the full variable set from the reference variables.css:
     colors, typography scale, spacing scale, borders, shadows, transitions, z-index
   - Base typography: h1–h6, body, caption, mono — matching reference sizes
   - Scrollbar styling to match the theme

3. LAYOUT SHELL (React + React Router) — MATCH TxDOT LAYOUT EXACTLY
   This is NOT a sidebar dashboard. It uses a government-style top-nav layout:

   a. UTILITY BAR — thin strip at the very top
      - Light gray background (#dadee5)
      - Right-aligned: "Contact us »" link, language dropdown (English/Español)

   b. SITE HEADER — white background, below utility bar
      - Left: TxDOT logo (80px) + project title (h1, blue) + subtitle (small, muted)
      - Right: search input with rounded pill border
      - Mobile: wraps, logo shrinks to 60px

   c. MAIN NAVIGATION BAR — full-width TxDOT Blue (#0056a9)
      - Horizontal menu items: white text, dark-blue hover/active background
      - Dropdown mega-menus: white panel with title, description, CTA link
      - Mobile: hamburger toggle, vertical slide-down menu
      - Items with dropdowns show a chevron that rotates on hover

   d. MAIN CONTENT AREA
      - Sections alternate white / #f5f7f9 backgrounds
      - Consistent padding (64px top/bottom)
      - Container centered at max 1280px

   e. FOOTER — light gray (#dadee5) background
      - 3-column grid: Contact info | Quick links | TxDOT logo + "Visit TxDOT.gov"
      - Mobile: stacks to single column

4. REUSABLE COMPONENTS (styled but empty — no data or charts)
   - PageHeader         ← page title + subtitle + breadcrumb, alt background
   - StatCard           ← large number + label, white bg, subtle shadow (match reference)
   - StatCard--highlight← gradient blue background, white text variant
   - ChartCard          ← titled card with fixed-height empty chart container div
   - FilterBar          ← horizontal row of filter controls (empty slots)
   - DataTable          ← styled header row, alternating row colors, hover states
   - RegionCard         ← image + content + link card (hover lift effect)
   - Badge              ← small status label (uses accent color)
   - Breadcrumb         ← slash-separated navigation trail
   - MapEmbed           ← responsive iframe wrapper with click-to-interact overlay
   - ResetFiltersButton ← outlined button, clears all filters
   - KpiCard            ← metric label, large number, trend indicator (up/down arrow)
   - SectionBlock       ← wrapper that applies alternating section backgrounds
   - HeroSection        ← background image with semi-transparent text card overlay
   - Button variants    ← primary (blue), secondary (outline), white, sizes (sm, base, lg)

5. SHADCN/UI COMPONENT OVERRIDES
   - Override shadcn/ui default colors to use TxDOT brand tokens
   - Components to override: Select, RadioGroup, Checkbox, DatePicker, Button, Separator
   - Focus ring color: rgba(0, 86, 169, 0.15) — matching reference

6. D3 COLOR SCALE EXPORT
   - Export a named D3 ordinal color scale using the TxDOT chart palette:
     ["#0056a9", "#002e69", "#196533", "#df5c16", "#5f0f40", "#8ec02d", "#f2ce1b", "#c5bbaa", "#d90d0d"]
   - File: /src/lib/chartColors.js

7. FOLDER STRUCTURE
   Create this exact structure:
   /public
     /assets
       /Logos            ← TxDOT logo SVGs
   /src
     /assets             ← icons, images
     /components
       /layout           ← UtilityBar, SiteHeader, MainNav, Footer, PageWrapper
       /ui               ← StatCard, ChartCard, FilterBar, DataTable, Badge, etc.
     /lib
       chartColors.js    ← D3 color scale
       tokens.js         ← JS export of all brand tokens (for D3 access)
     /styles
       globals.css       ← CSS variables + base styles (port from reference)
     /pages
       /Home             ← placeholder landing page with hero + stat cards
       /Demo             ← one demo page showing all components with fake data
     App.jsx
     main.jsx
   tailwind.config.js
   README.md             ← how to clone this boilerplate for a new project

Vibe and tone — match the TxDOT reference project:
- Light, clean, government/institutional feel
- Plenty of whitespace
- Subtle shadows on cards (not heavy)
- No gradients except the blue gradient (used sparingly for CTA sections)
- Charts should feel data-forward, not decorative
- Typography: IBM Plex Sans — crisp and readable at small sizes
- Sections alternate white and light gray (#f5f7f9)
- Active/hover states use dark blue (#002e69)

Do NOT add any real data, API calls, or D3 charts.
Leave ChartCard containers as empty divs with a light placeholder background.
The goal is a pixel-perfect shell matching TxDOT's existing web presence.
```

---

### How to Use the Boilerplate in a New Project

When starting a new project session in Claude Code:

```
I am building a new TxDOT dashboard project using an existing boilerplate.
The boilerplate is located at: [PATH TO BOILERPLATE FOLDER]

The reference TxDOT theme is at:
  C:/Users/UNT/UNT System/TxDOT IAC 2025-26 - General/Task 1 - Bridges and Border Crossings Guide/Task 1.4 - 2026 Bridge WebApp/page-previews/

Inherit all styling, components, and layout from the boilerplate.
Do not change any colors, fonts, or layout shell components.

For this project:
- Dashboard title:      PLACEHOLDER (displayed in the site header)
- Subtitle:             PLACEHOLDER (e.g., "International Trade and Border Planning Branch | TxDOT")
- Nav items:            PLACEHOLDER (e.g., "Overview, Trade Analysis, Crossings, Trends")
- Data source:          PLACEHOLDER (e.g., CSV file at /data/project.csv)
- Chart types per page: PLACEHOLDER

Use the D3 + Crossfilter stack as defined in this reference guide.
Import chartColors from /src/lib/chartColors.js for all chart color scales.
```

---

## Tech Stack Summary

| Purpose | Library | Why |
|---|---|---|
| Build tool | Vite | Fast dev server, modern ESM |
| UI framework | React 18+ | Component model, ecosystem |
| Styling | Tailwind CSS | Utility-first, design token friendly |
| **Charts** | **D3.js v7** | **Full control, no ceiling** |
| **Cross-filtering** | **Crossfilter2** | **Native D3 integration, sub-30ms** |
| Filter UI / Shell | Shadcn/ui | Claude Code knows it well |
| Routing | React Router v6 | Multi-page navigation |
| Shared state | Zustand | Lightweight, simple |
| Icons | Lucide React | Consistent icon set |
| Font | IBM Plex Sans | TxDOT brand standard |

---

## D3 + Crossfilter Key Concepts

```js
// Crossfilter workflow
const cf = crossfilter(data)              // create instance from array
const dim = cf.dimension(d => d.field)    // define a filterable dimension
const group = dim.group()                 // aggregate data for chart rendering
dim.filter(value)                         // apply a filter on a dimension
cf.allFiltered()                          // get all records passing current filters
dim.filterAll()                           // clear a single dimension's filter

// D3 in React — standard pattern
const ref = useRef()
useEffect(() => {
  const svg = d3.select(ref.current)
  // build chart here using group.all() for data
}, [filteredData])

// ResizeObserver for responsive charts
const observer = new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect
  // re-render chart with new dimensions
})
observer.observe(containerRef.current)
```

---

## TxDOT-Specific CSS Reference

The following CSS variable tokens should be replicated exactly from the reference project.
These are the source of truth for all spacing, typography, and visual decisions:

```css
/* Typography Scale */
--font-size-xs:   0.75rem;    /* 12px — axis ticks, captions */
--font-size-sm:   0.875rem;   /* 14px — labels, footer text */
--font-size-base: 1rem;       /* 16px — body text */
--font-size-md:   1.125rem;   /* 18px — section headings */
--font-size-lg:   1.25rem;    /* 20px — card titles */
--font-size-xl:   1.5rem;     /* 24px — page titles */
--font-size-2xl:  1.875rem;   /* 30px — h3 */
--font-size-3xl:  2.25rem;    /* 36px — h2, hero title */
--font-size-4xl:  3rem;       /* 48px — h1 */

/* Font Weights */
--font-weight-light:    300;
--font-weight-normal:   400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;

/* Spacing Scale */
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px — section padding */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow:    0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Border Radii */
--border-radius-sm:   0.25rem;  /* 4px */
--border-radius:      0.375rem; /* 6px */
--border-radius-md:   0.5rem;   /* 8px */
--border-radius-lg:   0.75rem;  /* 12px */
--border-radius-full: 9999px;   /* pill shapes, search input */

/* Transitions */
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

---

For reference links and example dashboards, see **dashboard-references.md**.
