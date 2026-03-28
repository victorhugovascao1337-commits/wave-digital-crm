import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Wave Digital - Gestão Clínica',
  description: 'Sistema completo de gestão para clínicas. Gerencie pacientes, consultas, pagamentos e muito mais.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Wave Digital - Gestão Clínica',
    description: 'Sistema completo de gestão para clínicas. Gerencie pacientes, consultas, pagamentos e muito mais.',
    siteName: 'Wave Digital',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
