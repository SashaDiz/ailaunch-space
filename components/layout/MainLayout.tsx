import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdBanner } from '@/components/marketing/AdBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AdBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
