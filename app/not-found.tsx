import { MainLayout } from '@/components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Page not found</p>
        <a href="/" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
          Go Home
        </a>
      </div>
    </div>
    </MainLayout>
  );
}
