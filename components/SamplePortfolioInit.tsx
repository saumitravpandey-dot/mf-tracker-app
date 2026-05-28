'use client'

import { useEffect } from 'react'
import { ensureSamplePortfolio } from '@/lib/store'

/** Mounts once in the layout and ensures the Sample Portfolio is always seeded. */
export default function SamplePortfolioInit() {
  useEffect(() => {
    ensureSamplePortfolio()
  }, [])
  return null
}
