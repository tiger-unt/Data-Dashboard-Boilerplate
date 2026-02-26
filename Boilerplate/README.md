# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Audit Command Bundle (Dataset Swaps)

Use these commands before and after changing CSV datasets so future agents can validate behavior consistently.

- `npm run check:schema`
  - Verifies required dataset columns and sample value parsing.
- `npm run check:functional -- http://localhost:5173`
  - Runs deep interaction checks (CSV export, PNG export, fullscreen, filters, table behavior).
- `npm run check:responsive -- http://localhost:5173`
  - Runs multi-viewport checks (mobile/tablet/desktop) for overflow and responsive interactions.
- `npm run check:visual -- http://localhost:5173`
  - Runs route-level visual/health checks and captures screenshots.
- `npm run check:all -- http://localhost:5173`
  - Runs the full bundle in sequence: schema -> functional -> responsive -> visual.
  - Exits on first failure to make CI/manual troubleshooting faster.

### Notes

- Start the dev server first for UI checks (`check:functional`, `check:responsive`, `check:visual`, `check:all`).
- If your dev server is on a different port, pass that URL after `--` (example: `npm run check:all -- http://localhost:5175`).

