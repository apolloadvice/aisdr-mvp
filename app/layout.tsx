import type { Metadata } from 'next';
import { Inter, Sora, Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { FontProvider } from '@/lib/theme/font-provider';
import { Header } from '@/components/header';
import { AuthProvider } from '@/components/auth/auth-provider.client';
import { AuthModal } from '@/components/auth/auth-modal.client';
import { ProfileModal } from '@/components/profile-modal.client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://remes.ai';

export const metadata: Metadata = {
  title: { default: 'Remes', template: '%s | Remes' },
  description: 'AI-powered outbound sales that finds and converts high-intent leads',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Remes',
    description: 'AI-powered outbound sales that finds and converts high-intent leads',
    url: SITE_URL,
    siteName: 'Remes',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Remes',
    description: 'AI-powered outbound sales that finds and converts high-intent leads'
  },
  icons: {
    icon: '/remes-logo.png',
    apple: '/remes-logo.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-font="space-grotesk"
      className={cn(sora.variable, inter.variable, spaceGrotesk.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider defaultTheme="light">
          <FontProvider>
            <TooltipProvider>
              <AuthProvider>
                <Header />
                <AuthModal />
                <ProfileModal />
                {children}
                <Toaster />
                <Analytics />
              </AuthProvider>
            </TooltipProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
