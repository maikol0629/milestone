import type { ReactNode } from 'react'

import { Sidebar } from '@/components/layout/sidebar'
import { SkipNav } from '@/components/layout/skip-nav'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SkipNav />
      <Sidebar />
      <main id="main-content" className="ml-64 flex-1 p-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  )
}
