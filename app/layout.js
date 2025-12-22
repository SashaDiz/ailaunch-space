import "./globals.css";
import Script from "next/script";
import { Providers } from "./components/Providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const stripTrailingSlash = (value) => value?.replace(/\/+$/, "");

const preferredCanonicalUrl =
  stripTrailingSlash(process.env.NEXT_PUBLIC_CANONICAL_URL) ||
  "https://ailaunch.space";

const deploymentUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
);

const metadataBaseOrigin =
  stripTrailingSlash(deploymentUrl || preferredCanonicalUrl) ||
  "https://www.ailaunch.space";

const withWwwVariant = preferredCanonicalUrl.includes("://www.")
  ? preferredCanonicalUrl.replace("://www.", "://")
  : preferredCanonicalUrl.replace("://", "://www.");

const ogImagePath = "/assets/OG_img.png";

const ogImageCandidates = [
  `${metadataBaseOrigin}${ogImagePath}`,
  `${preferredCanonicalUrl}${ogImagePath}`,
];

if (withWwwVariant !== preferredCanonicalUrl) {
  ogImageCandidates.push(`${withWwwVariant}${ogImagePath}`);
}

const ogImageUrls = Array.from(new Set(ogImageCandidates.filter(Boolean)));

export const metadata = {
  metadataBase: new URL(metadataBaseOrigin),
  title: "AI Launch Space - Weekly Competition Platform for AI Projects",
  description:
    "Submit your AI project to the weekly competition and get high authority backlinks. Join the community of successful AI builders and innovators.",
  keywords: [
    "AI",
    "artificial intelligence",
    "AI tools",
    "AI launch",
    "backlinks",
    "SEO",
    "AI projects",
    "product hunt for AI",
    "AI directory",
    "machine learning",
  ],
  authors: [{ name: "AI Launch Space" }],
  creator: "AI Launch Space",
  publisher: "AI Launch Space",
  alternates: {
    canonical: preferredCanonicalUrl,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: preferredCanonicalUrl,
    title: "AI Launch Space - Weekly Competition Platform for AI Projects",
    description:
      "Submit your AI project to the weekly competition and get high authority backlinks.",
    siteName: "AI Launch Space",
    images: ogImageUrls.map((url) => ({
      url,
      secureUrl: url,
      width: 1200,
      height: 630,
      alt: "AI Launch Space - Weekly Competition Platform for AI Projects",
    })),
  },
  twitter: {
    card: "summary_large_image",
    site: "@ailaunchspace",
    title: "AI Launch Space - Weekly Competition Platform for AI Projects",
    description:
      "Submit your AI project to the weekly competition and get high authority backlinks.",
    images: ogImageUrls,
    creator: "@ailaunchspace",
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
    google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ailaunch.space";
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AI Launch Space",
    "description": "Weekly Competition Platform for AI Projects",
    "url": baseUrl,
    "logo": `${baseUrl}/assets/logo.svg`,
    "sameAs": [
      "https://x.com/ailaunchspace"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${baseUrl}/contact`
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AI Launch Space",
    "description": "Submit your AI project to the weekly competition and get high authority backlinks. Join the community of successful AI builders and innovators.",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/projects?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" data-theme="light" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/assets/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ED0D79" />
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
      </head>
      <body className="antialiased overflow-x-hidden" suppressHydrationWarning={true}>
        {/* Hidden link for Startup Fame bot verification - always in static HTML */}
        <a 
          href="https://startupfa.me/s/ailaunch.space?utm_source=www.ailaunch.space" 
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
          aria-hidden="true"
        >
          Startup Fame
        </a>
        <noscript>
          <a href="https://startupfa.me/s/ailaunch.space?utm_source=www.ailaunch.space">Startup Fame</a>
        </noscript>
        <Providers>
          <div className="min-h-screen bg-base-100 flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="302768bfc01e"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
