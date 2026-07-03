import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Session } from './pages/Session'
import { History } from './pages/History'
import { Auth } from './pages/Auth'
import { About } from './pages/About'
import { DemoFlow } from './components/DemoFlow'

// Internal-only route used by the marketing-video capture harness to drive the
// interactive demo in isolation — never linked from the real site.
function DemoCapturePage() {
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 16, background: '#fdf8f0' }}>
      <DemoFlow appMode="epistemic" />
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session/:id" element={<Session />} />
      <Route path="/history" element={<History />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/about" element={<About />} />
      <Route path="/internal/demo-capture" element={<DemoCapturePage />} />
    </Routes>
  )
}
