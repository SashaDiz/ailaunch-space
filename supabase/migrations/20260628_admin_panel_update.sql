-- ============================================================================
-- Admin panel update — blog posts + promotion per-placement copy
-- ============================================================================
-- Two DB changes introduced with the admin-panel rework:
--   1. `blog_posts` table — admin-authored articles (managed under /admin/blog),
--      merged into the public blog alongside the markdown files.
--   2. `promotions.banner_text` (<=50) and `promotions.catalog_detail_text`
--      (<=100) — per-placement copy editable in the admin Advertising form and
--      the public /promote submission form.
--
-- Safe to run multiple times (every statement is IF NOT EXISTS / guarded).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Promotions: per-placement copy
--    banner_text         → shown on the Top banner placement (<= 50 chars)
--    catalog_detail_text → shown on Catalog cards and Detail pages (<= 100)
-- ---------------------------------------------------------------------------
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS banner_text VARCHAR(50) DEFAULT NULL;

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS catalog_detail_text VARCHAR(100) DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- 2. Blog posts (admin-authored articles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  category TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  reading_time INTEGER NOT NULL DEFAULT 1,
  meta_keywords TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='Live blog posts viewable by everyone') THEN
    CREATE POLICY "Live blog posts viewable by everyone" ON public.blog_posts FOR SELECT
      USING (status = 'published' OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= NOW()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='Admins can view all blog posts') THEN
    CREATE POLICY "Admins can view all blog posts" ON public.blog_posts FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='Only admins can modify blog posts') THEN
    CREATE POLICY "Only admins can modify blog posts" ON public.blog_posts FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = (SELECT auth.uid()) AND role = 'admin'));
  END IF;
END $$;

COMMIT;
