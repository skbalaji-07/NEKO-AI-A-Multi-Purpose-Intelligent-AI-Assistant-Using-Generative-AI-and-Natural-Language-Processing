import { useState } from 'react'
import { Briefcase, Check, ChevronDown, ChevronRight, Copy, FileSignature, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useUser } from '../App'
import { INTERVIEW_BANK, generateCoverLetter, improveBullet, type BulletReview } from '../lib/career'
import { logActivity } from '../lib/store'
import { Badge, Button, Card, Input, PageHeader, Segmented, Textarea } from '../components/ui'

export default function Career() {
  const [tab, setTab] = useState<'resume' | 'interview' | 'letter'>('resume')
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Career"
        subtitle="Sharpen resume bullets, drill role-specific interview questions, and generate tailored cover letters."
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'resume', label: <span className="flex items-center gap-1.5"><Sparkles size={13} /> Resume</span> },
              { value: 'interview', label: <span className="flex items-center gap-1.5"><MessageCircleQuestion size={13} /> Interview</span> },
              { value: 'letter', label: <span className="flex items-center gap-1.5"><FileSignature size={13} /> Cover letter</span> },
            ]}
          />
        }
      />
      {tab === 'resume' && <Resume />}
      {tab === 'interview' && <Interview />}
      {tab === 'letter' && <Letter />}
    </div>
  )
}

function Resume() {
  const user = useUser()
  const [bullet, setBullet] = useState('')
  const [review, setReview] = useState<BulletReview | null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <div className="mb-2 font-display text-[14px] font-bold">Resume bullet enhancer</div>
        <p className="mb-2 text-[12px] text-mut">Paste one bullet from your resume. NEKO upgrades weak verbs, strips first-person, and coaches you on metrics & impact structure.</p>
        <Textarea rows={4} value={bullet} onChange={(e) => setBullet(e.target.value)} placeholder="e.g. worked on the company website and helped fix bugs" />
        <Button className="mt-3 w-full" disabled={!bullet.trim()} onClick={() => { setReview(improveBullet(bullet)); logActivity(user.userId, 'career', 'Enhanced a resume bullet') }}>
          <Sparkles size={14} /> Enhance bullet
        </Button>
        <button className="mt-2 text-[11.5px] font-bold text-accent hover:underline" onClick={() => setBullet('was responsible for testing the app and fixed bugs before release')}>Try an example</button>
      </Card>
      <Card>
        <div className="mb-2 font-display text-[14px] font-bold">Result</div>
        {review ? (
          <div className="fade-up space-y-3">
            <div className="rounded-xl border-l-2 border-green bg-green/8 p-3 text-[13.5px] font-semibold">{review.improved}</div>
            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mut">Coaching notes</div>
              <ul className="space-y-1.5">
                {review.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-mut"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-[12.5px] text-mut">The enhanced bullet and coaching notes appear here. Formula: <strong className="text-ink">Action verb + what you did + measurable result</strong>.</p>
        )}
      </Card>
    </div>
  )
}

function Interview() {
  const [role, setRole] = useState<string>(Object.keys(INTERVIEW_BANK)[0])
  const [open, setOpen] = useState<number | null>(null)
  const qs = INTERVIEW_BANK[role]

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {Object.keys(INTERVIEW_BANK).map((r) => (
          <button key={r} onClick={() => { setRole(r); setOpen(null) }}>
            <Badge tone={r === role ? 'accent' : 'mut'} className="cursor-pointer px-3 py-1.5 text-[12px]">{r}</Badge>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {qs.map((q, i) => (
          <Card key={i} className="cursor-pointer transition hover:border-accent/50" >
            <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen(open === i ? null : i)}>
              <Briefcase size={14} className="shrink-0 text-accent" />
              <span className="flex-1 text-[13.5px] font-bold">{q.q}</span>
              {open === i ? <ChevronDown size={15} className="text-mut" /> : <ChevronRight size={15} className="text-mut" />}
            </button>
            {open === i && (
              <div className="fade-up mt-3 rounded-xl border-l-2 border-accent bg-surface2/50 p-3 text-[12.5px] leading-relaxed text-mut">
                <strong className="text-ink">How to answer:</strong> {q.guide}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function Letter() {
  const user = useUser()
  const [form, setForm] = useState({ name: user.name, role: '', company: '', skills: '', highlight: '' })
  const [letter, setLetter] = useState('')
  const [copied, setCopied] = useState(false)
  const ready = form.name && form.role && form.company && form.skills && form.highlight

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <div className="mb-3 font-display text-[14px] font-bold">Cover letter generator</div>
        <div className="space-y-2.5">
          <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Role (e.g. Junior ML Engineer)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input placeholder="Key skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <Textarea rows={3} placeholder="One highlight/achievement that represents your work" value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })} />
          <Button className="w-full" disabled={!ready} onClick={() => { setLetter(generateCoverLetter(form)); logActivity(user.userId, 'career', `Generated cover letter for ${form.company}`) }}>
            <FileSignature size={14} /> Generate letter
          </Button>
        </div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[14px] font-bold">Draft</div>
          {letter && (
            <button className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-mut hover:text-accent" onClick={() => { navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
              {copied ? <Check size={11} className="text-green" /> : <Copy size={11} />} {copied ? 'copied' : 'copy'}
            </button>
          )}
        </div>
        {letter ? (
          <pre className="fade-up whitespace-pre-wrap rounded-xl bg-surface2/50 p-3.5 font-body text-[12.5px] leading-relaxed">{letter}</pre>
        ) : (
          <p className="text-[12.5px] text-mut">Fill the form and NEKO assembles a structured, professional letter — hook, evidence, working style, close. Edit before sending; it's a strong first draft, not a final word.</p>
        )}
      </Card>
    </div>
  )
}
