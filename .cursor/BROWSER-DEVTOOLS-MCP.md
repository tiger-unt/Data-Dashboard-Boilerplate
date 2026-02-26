# Browser Automation & Chrome DevTools via MCP (Cursor)

This project is set up to mirror the anti-gravity–style workflow: **launch browser → navigate → click & fill forms → run E2E checks**, with **Chrome DevTools via MCP** and optional **recording/audit trails**.

## What’s configured

### 1. Chrome DevTools MCP (project)

- **Config:** `.cursor/mcp.json`
- **Server:** `chrome-devtools-mcp` (runs via `npx` so it stays up to date).
- **Capabilities:**
  - Inspect live DOM and styles
  - Capture network requests and traces
  - Run Lighthouse audits and Core Web Vitals
  - Take screenshots and test responsive layouts
  - Debug accessibility
  - Analyze performance
  - View console logs and JS errors

### 2. Browser automation (Cursor built-in)

- Use the **cursor-ide-browser** MCP (enable in **Cursor → Settings → Tools & MCP** if needed).
- **Workflow:** `browser_navigate` → `browser_lock` → interactions (e.g. `browser_snapshot`, click, type, fill) → `browser_unlock`.
- Use `browser_tabs` (action `list`) and `browser_snapshot` before clicks/typing so the agent has the current page structure.

Together you get:

- **Launch Chrome / navigate / click & fill:** cursor-ide-browser  
- **Chrome DevTools via MCP:** chrome-devtools-mcp  
- **Recording & audit:** see below.

## Requirements

- **Chrome** (stable/beta/dev/canary)
- **Cursor** (recent version; MCP support)
- **Node.js 20+** and **npm** (for `chrome-devtools-mcp`)

## Verify prerequisites

Run these in a terminal (PowerShell on Windows):

| Check | Command | Expected |
|-------|---------|----------|
| Node.js 20+ | `node --version` | e.g. `v20.x` or higher |
| npm | `npm --version` | any recent version |
| Chrome | See below | Chrome executable present |
| chrome-devtools-mcp | `npx -y chrome-devtools-mcp@latest --version` | e.g. `0.17.x` |

**Chrome on Windows:** Typically at `C:\Program Files\Google\Chrome\Application\chrome.exe` or `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`. If `chrome` is not on your PATH, the MCP can still find it via the default install path.

**Last verified on this machine:** Node v24.13.1, npm 11.8.0, Chrome (Program Files), chrome-devtools-mcp 0.17.3.

To re-verify anytime, run: `.\scripts\verify-browser-devtools-prereqs.ps1` (see below).

## One-time setup

1. **Restart Cursor** after adding or changing `.cursor/mcp.json` so the Chrome DevTools MCP loads.
2. **Enable cursor-ide-browser** in Cursor: **Settings (Ctrl+,) → Tools & MCP** and ensure the browser MCP is installed and enabled.
3. Optional: install DevTools MCP globally for a fixed version:
   ```bash
   npm install -g chrome-devtools-mcp
   ```
   Then in `.cursor/mcp.json` you can switch to:
   ```json
   "chrome-devtools": {
     "command": "chrome-devtools-mcp",
     "args": []
   }
   ```

## Recording & audit trails

When you ask the AI to run browser flows or E2E-style checks:

- **In-session:** The agent can summarize steps (navigate → click → fill → run DevTools/Lighthouse) in the chat.
- **Optional file log:** You can ask the agent to append a short, dated log of actions to a file (e.g. `.cursor/browser-session.log` or `docs/browser-audit.log`) so you have a simple audit trail.

Example prompt: *“Run through the login flow on localhost:3000 using the browser MCP, then run a Lighthouse performance check with Chrome DevTools MCP, and append a short audit log of the steps to `docs/browser-audit.log`.”*

## Example prompts

- “Open localhost:3000/app in the browser, take a snapshot, then run a Lighthouse performance audit using Chrome DevTools MCP.”
- “Use the browser MCP to navigate to our app, fill the login form, and then use Chrome DevTools MCP to check for accessibility issues.”
- “Take a mobile viewport screenshot with Chrome DevTools MCP and suggest layout improvements.”

## Advanced Chrome DevTools MCP options

You can pass extra args in `.cursor/mcp.json`, for example:

```json
"chrome-devtools": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest", "--viewport", "1280x720", "--headless"]
}
```

Options: `--channel` (stable/beta/dev/canary), `--viewport`, `--headless`, `--browserUrl` (attach to existing Chrome).
