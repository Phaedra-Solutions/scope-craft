import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScopeCraft | Software Cost, Squad Velocity & Architecture Estimator',
  description: 'ScopeCraft — Open-source software cost, engineering squad headcount, velocity planning, and architecture estimation studio with transparent regional rate benchmarks.',
  keywords: [
    'software cost estimator',
    'scoping tool',
    'gantt chart software',
    'team headcount calculator',
    'software agency sow generator',
    'open source scoping studio'
  ],
  authors: [{ name: 'Phaedra Solutions', url: 'https://phaedrasolutions.com' }],
  creator: 'Phaedra Solutions',
  publisher: 'Phaedra Solutions',
  openGraph: {
    title: 'ScopeCraft | Software Cost, Squad Velocity & Architecture Estimator',
    description: 'Precision software scoping, squad velocity balancing, and architecture cost estimation studio.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ScopeCraft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScopeCraft | Software Cost & Architecture Estimator',
    description: 'Open-source software scoping and engineering team capacity calculator.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-white text-[#082A1C] antialiased font-sans selection:bg-[#CDFF8C] selection:text-[#082A1C]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
