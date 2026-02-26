Run the Playwright visual check against the running local dev server to verify all dashboard pages render correctly, have no JS errors, and display expected content including the filter sidebar.

## Steps

1. **Ensure the dev server is running.** Check if `http://localhost:5173` responds. If not, start it:
   ```
   cd "C:/Users/UNT/UNT System/TxDOT IAC 2025-26 - General/Data-Dashboard-Boilerplate/Boilerplate"
   npx vite --host
   ```

2. **Run the visual check script** with screenshots:
   ```
   cd "C:/Users/UNT/UNT System/TxDOT IAC 2025-26 - General/Data-Dashboard-Boilerplate/Boilerplate"
   node scripts/visual-check.js http://localhost:5173 --screenshots
   ```

3. **Read the output** and report results to the user:
   - If all checks pass, confirm the app is healthy.
   - If any checks fail, diagnose the issue by reading the relevant source files, fix the code, and re-run the visual check to confirm the fix.

4. **Review screenshots** (in `Boilerplate/scripts/screenshots/`) if needed to visually confirm layout. The screenshots are PNG files that can be opened with the Read tool.

## What it checks per page

| Check | Description |
|-------|-------------|
| JS errors | No pageerror events fired |
| React errors | No error-boundary warnings in console |
| Content | Body has meaningful text (> 50 chars) |
| Expected text | Page-specific heading appears |
| Sidebar | aside element present on data pages |
| Nav links | At least 5 navigation links |
| Broken images | No img with naturalWidth === 0 |
| Network | No 4xx/5xx responses from same origin |
| Charts | SVG elements rendered on data pages |
| Screenshots | Full-page PNGs saved (with --screenshots flag) |

## Routes tested

- `/` Home / Overview
- `/trade-by-state` U.S. Trade by State
- `/commodities` Trade by Commodity
- `/trade-by-mode` Transportation Mode
- `/border-ports` TX Border Ports
