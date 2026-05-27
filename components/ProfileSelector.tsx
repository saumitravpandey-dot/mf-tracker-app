'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'mft_profile'

export function useProfile(): [string, (p: string) => void] {
  const [profile, setProfileState] = useState<string>('Default')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setProfileState(stored)
  }, [])

  function setProfile(p: string) {
    localStorage.setItem(STORAGE_KEY, p)
    setProfileState(p)
    window.dispatchEvent(new CustomEvent('mft_profile_change', { detail: p }))
  }

  return [profile, setProfile]
}

export default function ProfileSelector() {
  const [profile, setProfile] = useProfile()
  const [profiles, setProfiles] = useState<string[]>(['Default'])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data: { name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((p) => p.name)
          setProfiles(names)
          const stored = localStorage.getItem(STORAGE_KEY)
          if (!stored && names.length > 0) setProfile(names[0])
        }
      })
      .catch(() => {})
  }, [])

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const updated = [...profiles, name]
    setProfiles(updated)
    setProfile(name)
    setNewName('')
    setShowNew(false)
  }

  return (
    <div className="px-3 pb-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Profile</p>
      <select
        className="bg-zinc-800 text-white text-sm rounded px-2 py-1 w-full"
        value={profile}
        onChange={(e) => setProfile(e.target.value)}
      >
        {profiles.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      {showNew ? (
        <div className="mt-2 flex gap-1">
          <input
            className="flex-1 bg-zinc-700 text-white text-xs rounded px-2 py-1 min-w-0"
            placeholder="Profile name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            className="text-xs bg-indigo-600 text-white rounded px-2 py-1"
            onClick={handleCreate}
          >
            Save
          </button>
          <button
            className="text-xs text-zinc-400 hover:text-white px-1"
            onClick={() => setShowNew(false)}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          className="mt-1.5 text-xs text-zinc-400 hover:text-white"
          onClick={() => setShowNew(true)}
        >
          + New Profile
        </button>
      )}
    </div>
  )
}
