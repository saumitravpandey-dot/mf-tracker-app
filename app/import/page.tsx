'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProfiles, createProfile, addHolding } from '@/lib/store'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

interface ParsedRow {
  scheme_code: string
  scheme_name: string
  units: string
  buy_nav: string
  buy_date: string
  notes: string
  error?: string
}

interface ImportResult {
  total: number
  imported: number
  skipped: number
}

const STEPS = ['Select Profile', 'Upload CSV', 'Preview', 'Import'] as const

export default function ImportPage() {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState('')
  const [profiles, setProfiles] = useState<string[]>(['Default'])
  const [newProfileName, setNewProfileName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProfile(getProfile())
    const stored = getProfiles()
    if (stored.length > 0) setProfiles(stored.map((p) => p.name))
  }, [])

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length === 0) return []
    // Skip header if present
    const start = lines[0].toLowerCase().includes('scheme_code') ? 1 : 0
    return lines.slice(start).map((line) => {
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
      const [scheme_code, scheme_name, units, buy_nav, buy_date, notes = ''] = parts
      const errors: string[] = []
      if (!scheme_code || isNaN(Number(scheme_code))) errors.push('invalid scheme_code')
      if (!units || isNaN(parseFloat(units))) errors.push('invalid units')
      if (!buy_nav || isNaN(parseFloat(buy_nav))) errors.push('invalid buy_nav')
      if (!buy_date || isNaN(Date.parse(buy_date))) errors.push('invalid buy_date')
      return {
        scheme_code: scheme_code ?? '',
        scheme_name: scheme_name ?? '',
        units: units ?? '',
        buy_nav: buy_nav ?? '',
        buy_date: buy_date ?? '',
        notes,
        error: errors.length > 0 ? errors.join(', ') : undefined,
      }
    })
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    []
  )

  function handleImport() {
    setImporting(true)
    setProgress(0)
    setResult(null)
    const valid = rows.filter((r) => !r.error)
    let imported = 0
    let skipped = 0
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i]
      try {
        addHolding({
          scheme_code: parseInt(r.scheme_code),
          scheme_name: r.scheme_name,
          units: parseFloat(r.units),
          buy_nav: parseFloat(r.buy_nav),
          buy_date: r.buy_date,
          notes: r.notes,
          profile_name: profile,
        })
        imported++
      } catch {
        skipped++
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100))
    }
    setResult({ total: valid.length, imported, skipped })
    setImporting(false)
    setStep(3)
  }

  function handleCreateProfile() {
    const name = newProfileName.trim()
    if (!name) return
    createProfile(name)
    setProfiles([...profiles, name])
    setProfile(name)
    localStorage.setItem('mft_profile', name)
    setNewProfileName('')
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Import Holdings</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  i < step
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : i === step
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-zinc-300 text-zinc-400 bg-white'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  i === step ? 'text-indigo-600 font-medium' : 'text-zinc-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 ${i < step ? 'bg-indigo-600' : 'bg-zinc-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Select Profile */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Select a profile to import into</h2>
          <select
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-full mb-4"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Or create new profile…"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
            />
            <button
              onClick={handleCreateProfile}
              className="text-sm bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-lg"
            >
              Create
            </button>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!profile}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 1: Upload CSV */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h2 className="font-semibold text-zinc-900 mb-2">Upload CSV</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Expected format (header optional):
            <code className="block mt-1 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 font-mono">
              scheme_code,scheme_name,units,buy_nav,buy_date,notes
            </code>
          </p>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-zinc-300 hover:border-zinc-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <p className="text-zinc-500 text-sm">Drag &amp; drop your CSV here</p>
            <p className="text-zinc-400 text-xs mt-1">or click to browse</p>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
          <button
            onClick={() => setStep(0)}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">
              Preview — {rows.length} rows ({rows.filter((r) => !r.error).length} valid,{' '}
              {rows.filter((r) => r.error).length} errors)
            </h2>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              ← Back
            </button>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto mb-4">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-zinc-50">
                <tr className="text-zinc-500 uppercase">
                  <th className="text-left px-2 py-1.5">Code</th>
                  <th className="text-left px-2 py-1.5">Name</th>
                  <th className="text-right px-2 py-1.5">Units</th>
                  <th className="text-right px-2 py-1.5">NAV</th>
                  <th className="text-right px-2 py-1.5">Date</th>
                  <th className="text-left px-2 py-1.5">Error</th>
                  <th className="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b border-zinc-100 ${r.error ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-2 py-1.5 font-mono">{r.scheme_code}</td>
                    <td className="px-2 py-1.5 max-w-[120px] truncate">{r.scheme_name}</td>
                    <td className="text-right px-2 py-1.5">{r.units}</td>
                    <td className="text-right px-2 py-1.5">{r.buy_nav}</td>
                    <td className="text-right px-2 py-1.5">{r.buy_date}</td>
                    <td className="px-2 py-1.5 text-red-500">{r.error ?? ''}</td>
                    <td className="px-2 py-1.5">
                      <button
                        className="text-zinc-300 hover:text-red-500 text-xs"
                        onClick={() => setRows(rows.filter((_, j) => j !== i))}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={rows.filter((r) => !r.error).length === 0}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 3: Import */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Import to &quot;{profile}&quot;</h2>
          {!result ? (
            <>
              <p className="text-sm text-zinc-600 mb-6">
                Ready to import <strong>{rows.filter((r) => !r.error).length}</strong> valid rows.
                {rows.filter((r) => r.error).length > 0 && (
                  <span className="text-red-500 ml-1">
                    {rows.filter((r) => r.error).length} rows with errors will be skipped.
                  </span>
                )}
              </p>
              {importing && (
                <div className="mb-4">
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{progress}%</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={importing}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  ← Back
                </button>
                <button
                  onClick={() => handleImport()}
                  disabled={importing}
                  className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importing ? 'Importing…' : 'Import Now'}
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Import Complete</p>
                  <p className="text-sm text-zinc-500">
                    {result.imported} imported, {result.skipped} skipped out of {result.total}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStep(0)
                  setRows([])
                  setResult(null)
                }}
                className="bg-zinc-100 hover:bg-zinc-200 text-sm px-4 py-2 rounded-lg"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
