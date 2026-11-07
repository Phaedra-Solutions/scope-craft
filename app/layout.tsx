import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans selection:bg-blue-100 selection:text-blue-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
