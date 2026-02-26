# Verify prerequisites for Browser + Chrome DevTools MCP
# Run from repo root: .\scripts\verify-browser-devtools-prereqs.ps1

$ErrorActionPreference = "Stop"
$ok = 0
$fail = 0

function Test-Prereq($name, $condition, $detail) {
    if ($condition) {
        Write-Host "[OK] $name" -ForegroundColor Green
        if ($detail) { Write-Host "     $detail" }
        $script:ok++
    } else {
        Write-Host "[MISSING] $name" -ForegroundColor Red
        if ($detail) { Write-Host "     $detail" }
        $script:fail++
    }
}

# Node.js 20+
try {
    $v = node --version 2>$null
    $major = [int]($v -replace '^v(\d+).*','$1')
    Test-Prereq "Node.js 20+" ($major -ge 20) $v
} catch {
    Test-Prereq "Node.js 20+" $false "Install from https://nodejs.org"
}

# npm
try {
    $npmVer = npm --version 2>$null
    Test-Prereq "npm" $true $npmVer
} catch {
    Test-Prereq "npm" $false "Install Node.js (includes npm)"
}

# Chrome
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chromeFound = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
Test-Prereq "Chrome" ($null -ne $chromeFound) $(if ($chromeFound) { $chromeFound } else { "Install Google Chrome" })

# chrome-devtools-mcp (via npx)
try {
    $mcpVer = npx -y chrome-devtools-mcp@latest --version 2>$null
    Test-Prereq "chrome-devtools-mcp (npx)" ($LASTEXITCODE -eq 0) $mcpVer
} catch {
    Test-Prereq "chrome-devtools-mcp (npx)" $false "Ensure Node/npm and network are available"
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host "All prerequisites satisfied ($ok checks)." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some prerequisites missing: $fail failed, $ok passed." -ForegroundColor Yellow
    exit 1
}
