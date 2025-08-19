import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import React from 'react';

export const metadata: Metadata = {
  title: 'Meesho Profit & Loss Calculator | Free Analytics Dashboard',
  description: 'The best free tool for Meesho sellers to instantly calculate their profit and loss. Upload your sales data to get a detailed analytics dashboard and make data-driven decisions to grow your business.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <style>{`
          :root { font-family: 'Inter', sans-serif; }
        `}</style>
        {/* The SheetJS script is now loaded with a lazy strategy to avoid blocking the main thread during initial page load. */}
        <Script 
          src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js" 
          strategy="lazyOnload" 
        />
      </head>
      <body>{children}</body>
    </html>
  )
}