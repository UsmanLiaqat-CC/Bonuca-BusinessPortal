import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Services } from '@/services/container'
import { ServicesProvider } from '@/state/services'
import { ThemeProvider } from '@/state/theme'
import { ToastProvider } from '@/state/toast'
import { I18nProvider } from '@/i18n'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: (count, error) => count < 1 && !(error instanceof Error && error.name === 'AccessDeniedError'), refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

export function Providers({ services, children, queryClient }: { services: Services; children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={client}>
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ServicesProvider>
  )
}
