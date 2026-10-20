import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { createServices } from '@/services/container'
import { Providers } from './providers'
import { createRouter } from './router'

export function App() {
  const [services] = useState(createServices)
  const [router] = useState(createRouter)
  return (
    <Providers services={services}>
      <RouterProvider router={router} />
    </Providers>
  )
}
