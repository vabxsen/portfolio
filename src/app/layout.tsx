import type { Metadata, Viewport } from 'next';
import { profile } from '@/data/portfolio';
import localFont from 'next/font/local';
const manrope = localFont({
  src: '../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  variable: '--font-manrope',
  display: 'swap',
});
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Vaibhav Sen — Developer & UI/UX Designer', template: '%s — Vaibhav Sen' },
  description: profile.introduction,
  ...(profile.siteUrl
    ? { metadataBase: new URL(profile.siteUrl), alternates: { canonical: '/' } }
    : {}),
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Vaibhav Sen — Developer & UI/UX Designer',
    description: profile.introduction,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Vaibhav Sen — Developer & UI/UX Designer',
    description: profile.introduction,
  },
};
export const viewport: Viewport = { themeColor: '#101010', colorScheme: 'dark' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
