'use client'

import { useEffect, useState } from 'react'
import FundSearchInput from '@/components/FundSearchInput'
import HoldingsTable from '@/components/HoldingsTable'
import { formatINR, colorForValue } from '@/lib/types'
import type { HoldingRow, SchemeResult } from '@/lib/types'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

const EMPTY_FORM = {
  scheme_code: 0,
  scheme_name: '',
  units: '',
  buy_nav: '',
  buy_date: '',
  notes: '',
}

export default function PortfolioPage() {
  const [profile, setProfileState] = useState('Default')
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setProfileState(getProfile())
    function onChange(e: Event) {
      setProfileState((e as CustomEvent).detail as string)
    }
    window.addEventListener('mft_profile_change', onChange)
    return () => window.removeEventListener('mft_profile_change', onChange)
  }, [])

  async function loadHoldings(p: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/holdings?profile=${encodeURIComponent(p)}`)
      const data = await res.json()
      setHoldings(data ?? [])
    } catch {
      setHoldings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHoldings(profile)
  }, [profile])

  function onFundSelect(s: SchemeResult) {
    setForm((f) => ({
      ...f,
      scheme_code: s.schemeCode,
      scheme_name: s.schemeName,
      buy_nav: s.nav ? String(s.nav) : f.buy_nav,
    }))
  }

  async function handleSubmit() {
    setError('')
    if (!form.scheme_code || !form.units || !form.buy_nav || !form.buy_date) {
      setError('All fields except notes are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        scheme_code: form.scheme_code,
        scheme_name: form.scheme_name,
        units: parseFloat(form.units),
        buy_nav: parseFloat(form.buy_nav),
        buy_date: form.buy_date,
        notes: form.notes,
        profile_name: profile,
      }
      if (editingId) {
        await fetch(`/api/holdings/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setEditingId(null)
      } else {
        await fetch('/api/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setForm({ ...EMPTY_FORM })
      setShowAdd(false)
      loadHoldings(profile)
    } catch {
      setError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(h: HoldingRow) {
    setForm({
      scheme_code: h.scheme_code,
      scheme_name: h.scheme_name,
      units: String(h.units),
      buy_nav: String(h.buy_nav),
      buy_date: h.buy_date,
      notes: h.notes ?? '',
    })
    setEditingId(h.id)
    setShowAdd(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this holding?')) return
    await fetch(`/api/holdings/${id}`, { method: 'DELETE' })
    loadHoldings(profile)
  }

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0)
  const currentValue = holdings.reduce((s, h) => s + h.current_value, 0)
  const totalPnL = currentValue - totalInvested

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Portfolio</h1>
        <button
          onClick={() => {
            setShowAdd(!showAdd)
            setEditingId(null)
            setForm({ ...EMPTY_FORM })
          }}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {showAdd ? 'Cancel' : '+ Add Holding'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">
            {editingId ? 'Edit Holding' : 'Add Holding'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Fund</label>
              {!editingId ? (
                <FundSearchInput onSelect={onFundSelect} placeholder="Search and select a fund" />
              ) : (
                <input
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-zinc-50"
                  value={form.scheme_name}
                  readOnly
                />
              )}
              {form.scheme_name && (
                <p className="text-xs text-zinc-400 mt-1">{form.scheme_name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Units</label>
              <input
                type="number"
                step="any"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={form.units}
                onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Buy NAV (₹)</label>
              <input
                type="number"
                step="any"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={form.buy_nav}
                onChange={(e) => setForm((f) => ({ ...f, buy_nav: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Buy Date</label>
              <input
                type="date"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={form.buy_date}
                onChange={(e) => setForm((f) => ({ ...f, buy_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Notes (optional)</label>
              <input
                type="text"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add Holding'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-4">
        {loading ? (
          <p className="text-sm text-zinc-400 py-4 text-center">Loading…</p>
        ) : (
          <HoldingsTable holdings={holdings} onDelete={handleDelete} onEdit={handleEdit} />
        )}
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Invested</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{formatINR(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Current Value</p>
            <p className="text-xl font-bold text-zinc-900 mt-1">{formatINR(currentValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total P&L</p>
            <p className={`text-xl font-bold mt-1 ${colorForValue(totalPnL)}`}>
              {formatINR(totalPnL)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
