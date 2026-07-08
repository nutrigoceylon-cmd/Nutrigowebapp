import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import type { AddOn } from '../../types'
import { supabase } from '../../lib/supabase'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { Input, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/helpers'

const defaultForm = {
  name: '',
  description: '',
  image_url: '',
  price: 0,
}

export function AdminAddOns() {
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AddOn | null>(null)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('add_ons').select('*').order('created_at', { ascending: false })
    setAddOns(data ?? [])
  }

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  function openEdit(addOn: AddOn) {
    setEditing(addOn)
    setForm({
      name: addOn.name,
      description: addOn.description ?? '',
      image_url: addOn.image_url ?? '',
      price: addOn.price,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      price: form.price,
    }

    if (editing) {
      await supabase.from('add_ons').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('add_ons').insert({ ...payload, is_active: true })
    }

    await load()
    setModalOpen(false)
  }

  async function toggleActive(id: string) {
    const addOn = addOns.find(item => item.id === id)
    if (!addOn) return
    const is_active = !addOn.is_active
    await supabase.from('add_ons').update({ is_active }).eq('id', id)
    setAddOns(prev => prev.map(item => item.id === id ? { ...item, is_active } : item))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this add-on?')) return
    await supabase.from('add_ons').delete().eq('id', id)
    setAddOns(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add-Ons</h1>
          <p className="text-sm text-gray-500 mt-1">These are shown only inside the cart page as optional extras.</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={15} /> Add Add-On</Button>
      </div>

      <Table
        columns={[
          {
            key: 'name',
            label: 'Add-On',
            render: addOn => (
              <div className="flex items-center gap-3">
                {addOn.image_url
                  ? <img src={addOn.image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  : <div className="w-10 h-10 rounded-xl bg-light-green text-accent flex items-center justify-center text-lg">+</div>
                }
                <div>
                  <p className="font-medium text-gray-900">{addOn.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{addOn.description || 'Optional cart extra'}</p>
                </div>
              </div>
            ),
          },
          { key: 'price', label: 'Price', render: addOn => <span className="font-semibold text-primary">{formatCurrency(addOn.price)}</span> },
          { key: 'is_active', label: 'Status', render: addOn => <StatusBadge status={addOn.is_active ? 'active' : 'cancelled'} /> },
          {
            key: 'actions',
            label: '',
            render: addOn => (
              <div className="flex gap-2">
                <button onClick={() => openEdit(addOn)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary cursor-pointer"><Pencil size={14} /></button>
                <button onClick={() => toggleActive(addOn.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gold cursor-pointer"><Power size={14} /></button>
                <button onClick={() => handleDelete(addOn.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
        data={addOns}
        keyExtractor={addOn => addOn.id}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Add-On' : 'Add Add-On'} size="lg">
        <div className="space-y-4">
          <Input label="Add-On Name" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} placeholder="Fresh juice" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} rows={3} placeholder="Optional extra shown on cart page..." />
          <ImageUpload
            label="Add-On Image"
            value={form.image_url}
            onChange={url => setForm(current => ({ ...current, image_url: url }))}
          />
          <Input
            label="Price (LKR)"
            type="number"
            value={String(form.price)}
            onChange={e => setForm(current => ({ ...current, price: Number(e.target.value) }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancel</Button>
            <Button onClick={handleSave} fullWidth disabled={!form.name.trim()}>{editing ? 'Save Changes' : 'Add Add-On'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
