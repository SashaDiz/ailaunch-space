import "./globals.css";
import { Providers } from "./components/Providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: "AI Launch Space - Weekly Competition Platform for AI Projects & Get DR22+ Backlinks",
  description: "Submit your AI project to the weekly competition and get high authority backlinks. Join the community of successful AI builders and innovators.",
  keywords: ["AI", "artificial intelligence", "AI tools", "AI launch", "backlinks", "SEO", "AI projects", "product hunt for AI", "AI directory", "machine learning"],
  authors: [{ name: "AI Launch Space" }],
  creator: "AI Launch Space",
  publisher: "AI Launch Space",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://ailaunch.space",
    title: "AI Launch Space - Weekly Competition Platform for AI Projects & Get DR22+ Backlinks",
    description: "Submit your AI project to the weekly competition and get high authority backlinks.",
    siteName: "AI Launch Space",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Launch Space - Weekly Competition Platform for AI Projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Launch Space - Weekly Competition Platform for AI Projects & Get DR22+ Backlinks",
    description: "Submit your AI project to the weekly competition and get high authority backlinks.",
    images: ["/og-image.png"],
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
  return (
    <html lang="en" data-theme="light" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ED0D79" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        <Providers>
          <div className="min-h-screen bg-base-100 flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
