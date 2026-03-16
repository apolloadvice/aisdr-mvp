import type { Metadata } from 'next';
import { Geist_Mono, Inter, Sora, Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { FontProvider } from '@/lib/theme/font-provider';
import { Header } from '@/components/header';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
});

export const metadata: Metadata = {
  title: 'Signal',
  description: 'AI-powered outbound sales that finds and converts high-intent leads'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-font="sora"
      className={cn(sora.variable, inter.variable, spaceGrotesk.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>
          <FontProvider>
            <Header />
            {children}
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
