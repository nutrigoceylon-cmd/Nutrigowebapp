import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Power, X } from 'lucide-react'
import type { Provider, ProviderSpecialty, TimeSlot } from '../../types'
import { supabase } from '../../lib/supabase'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/helpers'
import { getProviderSpecialtyLabel, normalizeProviderSpecialty, providerSpecialties } from '../../lib/providers'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const defaultTimeSlots: TimeSlot[] = [
  { label: 'Morning', from: '09:00', to: '12:00' },
]

const defaultForm = {
  name: '', title: '', specialty: 'dietician' as ProviderSpecialty,
  bio: '', image_url: '', session_price: 50, session_duration: 60,
  available_days: [1, 2, 3, 4, 5], time_slots: defaultTimeSlots,
  languages: 'English', qualifications: '',
}

export function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('providers').select('*').order('created_at', { ascending: false })
    setProviders(data ?? [])
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(p: Provider) {
    setEditing(p)
    setForm({
      name: p.name, title: p.title, specialty: normalizeProviderSpecialty(p.specialty),
      bio: p.bio ?? '', image_url: p.image_url ?? '',
      session_price: p.session_price, session_duration: p.session_duration,
      available_days: p.available_days,
      time_slots: (p.time_slots && p.time_slots.length > 0) ? p.time_slots : defaultTimeSlots,
      languages: p.languages.join(', '),
      qualifications: p.qualifications.join(', '),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payload = {
      name: form.name, title: form.title, specialty: form.specialty,
      bio: form.bio, image_url: form.image_url,
      session_price: form.session_price, session_duration: form.session_duration,
      available_days: form.available_days, time_slots: form.time_slots,
      languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
      qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
    }
    if (editing) {
      await supabase.from('providers').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('providers').insert({ ...payload, is_active: true })
    }
    await load()
    setModalOpen(false)
  }

  async function toggleActive(id: string) {
    const p = providers.find(p => p.id === id)
    if (!p) return
    const is_active = !p.is_active
    await supabase.from('providers').update({ is_active }).eq('id', id)
    setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active } : p))
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this provider? All their bookings will also be removed.')) {
      await supabase.from('providers').delete().eq('id', id)
      setProviders(prev => prev.filter(p => p.id !== id))
    }
  }

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter(d => d !== day)
        : [...f.available_days, day].sort(),
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Session Providers</h1>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> Add Provider</Button>
      </div>

      <Table
        columns={[
          {
            key: 'name', label: 'Provider',
            render: p => (
              <div className="flex items-center gap-3">
                {p.image_url
                  ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{p.name[0]}</div>
                }
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.title}</p>
                </div>
              </div>
            ),
          },
          { key: 'specialty', label: 'Category', render: p => <span className="text-sm text-gray-600">{getProviderSpecialtyLabel(p.specialty)}</span> },
          { key: 'session_price', label: 'Price/Session', render: p => <span className="font-semibold text-primary">{formatCurrency(p.session_price)}</span> },
          { key: 'session_duration', label: 'Duration', render: p => <span className="text-sm text-gray-600">{p.session_duration} min</span> },
          { key: 'is_active', label: 'Status', render: p => <StatusBadge status={p.is_active ? 'active' : 'cancelled'} /> },
          {
            key: 'actions', label: '',
            render: p => (
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary cursor-pointer"><Pencil size={14} /></button>
                <button onClick={() => toggleActive(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gold cursor-pointer"><Power size={14} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
        data={providers}
        keyExtractor={p => p.id}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Provider' : 'Add Provider'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Smith" />
            <Input label="Title / Credential" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Registered Dietitian, MSc" />
          </div>
          <Select label="Specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value as ProviderSpecialty }))}
            options={providerSpecialties}
          />
          <Textarea label="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Brief professional background..." />
          <ImageUpload
            label="Profile Photo"
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Session Price ($)" type="number" value={String(form.session_price)} onChange={e => setForm(f => ({ ...f, session_price: Number(e.target.value) }))} />
            <Input label="Session Duration (min)" type="number" value={String(form.session_duration)} onChange={e => setForm(f => ({ ...f, session_duration: Number(e.target.value) }))} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Available Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((day, i) => {
                const val = i + 1
                const active = form.available_days.includes(val)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${active ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Time Slots</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, time_slots: [...(f.time_slots ?? []), { label: '', from: '09:00', to: '17:00' }] }))}
                className="flex items-center gap-1 text-xs text-primary hover:text-secondary font-medium cursor-pointer"
              >
                <Plus size={13} /> Add Slot
              </button>
            </div>
            <div className="space-y-2">
              {(form.time_slots ?? []).map((slot, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                  <Input
                    label={i === 0 ? 'Label' : undefined}
                    value={slot.label}
                    onChange={e => setForm(f => {
                      const ts = [...(f.time_slots ?? [])]
                      ts[i] = { ...ts[i], label: e.target.value }
                      return { ...f, time_slots: ts }
                    })}
                    placeholder="e.g. Morning"
                  />
                  <div>
                    {i === 0 && <label className="text-sm font-medium text-gray-700 block mb-1.5">From</label>}
                    <input
                      type="time"
                      value={slot.from}
                      onChange={e => setForm(f => {
                        const ts = [...(f.time_slots ?? [])]
                        ts[i] = { ...ts[i], from: e.target.value }
                        return { ...f, time_slots: ts }
                      })}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    {i === 0 && <label className="text-sm font-medium text-gray-700 block mb-1.5">To</label>}
                    <input
                      type="time"
                      value={slot.to}
                      onChange={e => setForm(f => {
                        const ts = [...(f.time_slots ?? [])]
                        ts[i] = { ...ts[i], to: e.target.value }
                        return { ...f, time_slots: ts }
                      })}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className={i === 0 ? 'mt-6' : ''}>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, time_slots: (f.time_slots ?? []).filter((_, j) => j !== i) }))}
                      disabled={(form.time_slots ?? []).length === 1}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Input label="Languages (comma-separated)" value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="English, Sinhala, Tamil" />
          <Input label="Qualifications (comma-separated)" value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="BSc Nutrition, MSc Dietetics, RD" />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancel</Button>
            <Button onClick={handleSave} fullWidth>{editing ? 'Save Changes' : 'Add Provider'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
