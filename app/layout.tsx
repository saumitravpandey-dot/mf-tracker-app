import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import SamplePortfolioInit from '@/components/SamplePortfolioInit'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'MF Tracker',
  description: 'Mutual Fund Portfolio Tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex h-screen overflow-hidden">
        <SamplePortfolioInit />
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50">{children}</main>
      </body>
    </html>
  )
}
