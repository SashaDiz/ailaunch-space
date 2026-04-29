import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdBanner } from '@/components/marketing/AdBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col relative z-10">
      {/* Outer wrapper adds breathing room around the card so the
          animated shader is visible at the edges of the viewport. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 flex-1 flex flex-col">
        {/* Inner card — semi-transparent + blur so content stays
            readable on top of the shader. Header + main + Footer all
            live inside the card. */}
        {/* `overflow-visible` (default) lets the sticky Header stick to the
            top of the viewport on scroll. `isolate` creates a new stacking
            context so backdrop-blur composes correctly. */}
        <div className="isolate rounded-[var(--radius)] border border-border/40 bg-background/80 backdrop-blur-md flex-1 flex flex-col">
          <Header />
          <AdBanner />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
