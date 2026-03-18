import type { Metadata } from 'next';
import { Inter, Sora, Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { FontProvider } from '@/lib/theme/font-provider';
import { Header } from '@/components/header';
import { AuthModal } from '@/components/auth/auth-modal.client';
import { ProfileModal } from '@/components/profile-modal.client';
import { TooltipProvider } from '@/components/ui/tooltip';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
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
      data-font="space-grotesk"
      className={cn(sora.variable, inter.variable, spaceGrotesk.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>
          <FontProvider>
            <TooltipProvider>
              <Header />
              <AuthModal />
              <ProfileModal />
              {children}
            </TooltipProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
