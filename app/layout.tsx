import "./globals.css";
import Script from "next/script";
import { Providers } from '@/components/shared/Providers';
import { siteConfig } from '@/config/site.config';
import { analyticsConfig } from '@/config/analytics.config';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { buildThemeInlineCSS } from '@/lib/theme-utils';
import { getLocale } from 'next-intl/server';
import { i18nConfig } from '@/config/i18n.config';

const fullTitle = `${siteConfig.name} - ${siteConfig.tagline}`;

export const metadata = {
  metadataBase: new URL(siteConfig.url || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: fullTitle,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: siteConfig.url,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: fullTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: fullTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: fullTitle,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    ...(siteConfig.social.twitter && { creator: siteConfig.social.twitter }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    }),
  },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  // Fetch admin theme from DB to prevent FOUC
  let initialTheme = null;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'theme')
      .maybeSingle();
    if (data?.value) {
      initialTheme = {
        activeThemeId: data.value.activeThemeId ?? 'default',
        customTheme: data.value.customTheme ?? undefined,
      };
    }
  } catch (e) {
    // Fallback to default theme on error
  }

  const themeCSS = initialTheme ? buildThemeInlineCSS(initialTheme) : '';
  const baseUrl = siteConfig.url;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.name,
    "description": siteConfig.tagline,
    "url": baseUrl,
    "logo": `${baseUrl}${siteConfig.logo.light}`,
    ...(siteConfig.social.twitter && {
      "sameAs": [
        `https://x.com/${siteConfig.social.twitter.replace('@', '')}`
      ],
    }),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${baseUrl}/contact`
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "description": siteConfig.description,
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang={locale} className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Oxanium:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href={siteConfig.favicon} sizes="any" />
        <link rel="icon" href="/assets/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta name="theme-color" content={siteConfig.themeColor} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {themeCSS && (
          <style
            id="server-theme-style"
            dangerouslySetInnerHTML={{ __html: themeCSS }}
          />
        )}
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        <Providers initialTheme={initialTheme}>
          {children}
        </Providers>
        {/* Google Analytics */}
        {analyticsConfig.googleAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.googleAnalytics.measurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsConfig.googleAnalytics.measurementId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
