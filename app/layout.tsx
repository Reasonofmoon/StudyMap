import type { ReactNode } from 'react'

export const metadata = {
  title: 'EduOntology MVP',
  description: 'EduOntology MVP',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

