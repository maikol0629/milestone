import type { Metadata } from 'next'
import { Toaster } from 'sonner'

import { AnalyticsProvider } from '@/providers/analytics-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { I18nProvider } from '@/providers/i18n-provider'
import { QueryProvider } from '@/providers/query-provider'
import { SyncProvider } from '@/providers/sync-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import './design-tokens.css'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Milestone', template: '%s — Milestone' },
  description: 'Gestiona tus objetivos, proyectos y tiempo',
  manifest: '/manifest.json',
  other: {
    'theme-color': '#3b82f6',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Milestone',
  },
  icons: {
    apple: '/icons/icon-192.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <QueryProvider>
          <SyncProvider>
            <I18nProvider>
              <AnalyticsProvider>
                <ThemeProvider>
                  <AuthProvider>{children}</AuthProvider>
                  <Toaster position="top-right" richColors />
                </ThemeProvider>
              </AnalyticsProvider>
            </I18nProvider>
          </SyncProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
