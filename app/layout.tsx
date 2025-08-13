import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata = {
  title: "Generate 99+ content style guidelines in minutes | AI Style Guide",
  description: "Stop asking ChatGPT to \"make it sound better.\" Create clear and consistent content, every time.",
  generator: 'v0.dev',
  keywords: 'brand style guide, content guidelines, brand voice, writing rules, content strategy, brand consistency, marketing guidelines',
  authors: [{ name: 'AI Style Guide' }],
  creator: 'AI Style Guide',
  publisher: 'AI Style Guide',
  openGraph: {
    title: "Generate 99+ content style guidelines in minutes | AI Style Guide",
    description: "Stop asking ChatGPT to \"make it sound better.\" Create clear and consistent content, every time.",
    url: 'https://aistyleguide.com',
    siteName: 'AI Style Guide',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://aistyleguide.com/brand-voice-guidelines.png',
        width: 1200,
        height: 630,
        alt: 'AI Style Guide - Generate professional brand style guides in minutes',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Generate 99+ content style guidelines in minutes | AI Style Guide",
    description: "Stop asking ChatGPT to \"make it sound better.\" Create clear and consistent content, every time.",
    creator: '@tahigichigi',
    site: '@aistyleguide',
    images: ['https://aistyleguide.com/brand-voice-guidelines.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-943197631"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-943197631');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
