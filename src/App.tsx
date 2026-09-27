import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getSession } from './lib/auth'
import type { Session } from './lib/types'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Study from './pages/Study'
import Documents from './pages/Documents'
import Notes from './pages/Notes'
import Tasks from './pages/Tasks'
import Coding from './pages/Coding'
import DataLab from './pages/DataLab'
import Career from './pages/Career'
import Writing from './pages/Writing'
import Research from './pages/Research'
import SettingsPage from './pages/Settings'
import Docs from './pages/Docs'

interface AuthCtx {
  session: Session | null
  setSession: (s: Session | null) => void
}

const AuthContext = createContext<AuthCtx>({ session: null, setSession: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

/** Only call inside authenticated routes. */
export function useUser(): Session {
  const { session } = useAuth()
  return session as Session
}

interface ThemeCtx {
  theme: 'dark' | 'light'
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession())
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('neko:theme') as 'dark' | 'light') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('neko:theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>
      <AuthContext.Provider value={{ session, setSession }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={session ? <Navigate to="/app" replace /> : <Landing />} />
            <Route path="/app" element={session ? <Layout /> : <Navigate to="/" replace />}>
              <Route index element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="study" element={<Study />} />
              <Route path="documents" element={<Documents />} />
              <Route path="notes" element={<Notes />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="coding" element={<Coding />} />
              <Route path="data" element={<DataLab />} />
              <Route path="career" element={<Career />} />
              <Route path="writing" element={<Writing />} />
              <Route path="research" element={<Research />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="docs" element={<Docs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
