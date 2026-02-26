/**
 * ── APP ENTRY POINT ─────────────────────────────────────────────────────
 *
 * Root application component that sets up:
 *   - BrowserRouter for client-side routing (React Router v6)
 *   - ScrollToTop helper — scrolls to top on every route change
 *   - Data loading on mount — calls tradeStore.loadData() once via useEffect
 *   - PageWrapper — shared chrome (SiteHeader + MainNav + Footer)
 *   - ErrorBoundary — catches render errors in any page component
 *   - Route definitions — maps URL paths to page components
 *
 * ── BOILERPLATE: HOW TO ADAPT ───────────────────────────────────────────
 * When adding a new page:
 *   1. Create the page component in src/pages/YourPage/index.jsx
 *   2. Import it here (add an import statement below)
 *   3. Add a <Route path="/your-path" element={<YourPage />} /> inside <Routes>
 *   4. Add a matching entry in MainNav's navItems array so users can navigate to it
 *   5. If the page needs a new dataset, add its loader to tradeStore.loadData()
 *
 * When removing a page:
 *   1. Delete its <Route> entry below
 *   2. Remove the import statement
 *   3. Remove the corresponding navItems entry in MainNav.jsx
 */
import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTradeStore } from '@/stores/tradeStore'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import PageWrapper from '@/components/layout/PageWrapper'
import HomePage from '@/pages/Home'
import TradeByStatePage from '@/pages/TradeByState'
import TradeByCommodityPage from '@/pages/TradeByCommodity'
import TradeByModePage from '@/pages/TradeByMode'
import BorderPortsPage from '@/pages/BorderPorts'
import NotFoundPage from '@/pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

function AppContent() {
  const loadData = useTradeStore((s) => s.loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <PageWrapper>
      <ScrollToTop />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trade-by-state" element={<TradeByStatePage />} />
          <Route path="/commodities" element={<TradeByCommodityPage />} />
          <Route path="/trade-by-mode" element={<TradeByModePage />} />
          <Route path="/border-ports" element={<BorderPortsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </PageWrapper>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
