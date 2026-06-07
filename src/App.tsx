import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Session } from './pages/Session'
import { History } from './pages/History'
import { Auth } from './pages/Auth'
import { About } from './pages/About'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session/:id" element={<Session />} />
      <Route path="/history" element={<History />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
