import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3, BookOpen, Briefcase, CheckSquare, Code2, FileText, Globe2,
  GraduationCap, LayoutDashboard, LogOut, Menu, MessagesSquare, Moon,
  PenLine, Settings, StickyNote, Sun, X, Zap,
} from 'lucide-react'
import { useAuth, useTheme, useUser } from '../App'
import { logout } from '../lib/auth'
import { NekoLogo, cn } from './ui'

const GROUPS: { label: string; items: { to: string; end?: boolean; icon: React.ReactNode; label: string }[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/app', end: true, icon: <LayoutDashboard size={16} />, label: 'Dashboard' }],
  },
  {
    label: 'Assistant',
    items: [
      { to: '/app/chat', icon: <MessagesSquare size={16} />, label: 'Chat' },
      { to: '/app/research', icon: <Globe2 size={16} />, label: 'Research' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/app/documents', icon: <FileText size={16} />, label: 'Documents' },
      { to: '/app/notes', icon: <StickyNote size={16} />, label: 'Notes' },
      { to: '/app/tasks', icon: <CheckSquare size={16} />, label: 'Tasks' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/app/study', icon: <GraduationCap size={16} />, label: 'Study' },
      { to: '/app/coding', icon: <Code2 size={16} />, label: 'Coding' },
      { to: '/app/data', icon: <BarChart3 size={16} />, label: 'Data Lab' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/app/career', icon: <Briefcase size={16} />, label: 'Career' },
      { to: '/app/writing', icon: <PenLine size={16} />, label: 'Writing' },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useUser()
  const { setSession } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const link = (item: { to: string; end?: boolean; icon: React.ReactNode; label: string }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors',
          isActive ? 'bg-accent/12 text-accent' : 'text-mut hover:bg-surface2 hover:text-ink',
        )
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <NekoLogo size={34} />
        <div>
          <div className="font-display text-[17px] font-bold leading-none tracking-tight">NEKO AI</div>
          <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-widest text-mut">Second brain · with claws</div>
        </div>
      </div>

      <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface2/50 px-3 py-2">
        <Zap size={13} className="text-green" />
        <span className="text-[11.5px] font-semibold text-mut">Local engine · <span className="text-green">online</span></span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-mut/70">{g.label}</div>
            <div className="space-y-0.5">{g.items.map(link)}</div>
          </div>
        ))}
        <div>
          <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-mut/70">System</div>
          <div className="space-y-0.5">
            {link({ to: '/app/docs', icon: <BookOpen size={16} />, label: 'Project Docs' })}
            {link({ to: '/app/settings', icon: <Settings size={16} />, label: 'Settings' })}
          </div>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-[13px] font-bold text-accent">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-bold">{user.name}</div>
            <div className="truncate text-[11px] text-mut">{user.email}</div>
          </div>
          <button
            title="Toggle theme"
            onClick={toggle}
            className="rounded-lg p-1.5 text-mut hover:bg-surface2 hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            title="Sign out"
            onClick={() => {
              logout()
              setSession(null)
              navigate('/')
            }}
            className="rounded-lg p-1.5 text-mut hover:bg-red/10 hover:text-red"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <div className="flex h-full">
      {/* desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-surface shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-mut hover:bg-surface2">
              <X size={17} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile topbar */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-mut hover:bg-surface2">
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-2">
            <NekoLogo size={24} />
            <span className="font-display text-[15px] font-bold">NEKO AI</span>
          </div>
          <button onClick={toggle} className="rounded-lg p-1.5 text-mut hover:bg-surface2">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
