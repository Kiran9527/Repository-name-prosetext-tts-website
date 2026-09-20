import type { Metadata } from "next";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://prosetext.online"),

  title: {
    default: "ProseText — AI Text to Speech & MP3 Generator",
    template: "%s | ProseText",
  },

  description:
    "Convert text into natural-sounding AI speech and download MP3 audio. No account required. Pay only when you generate.",

  keywords: [
    "AI text to speech",
    "text to speech",
    "AI voice generator",
    "text to voice",
    "voice generator",
    "MP3 voice generator",
    "AI voiceover",
    "voiceover generator",
    "online text to speech",
  ],

  authors: [
    {
      name: "ProseText",
    },
  ],

  creator: "ProseText",
  publisher: "ProseText",

  applicationName: "ProseText",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://prosetext.online",
    siteName: "ProseText",
    title: "ProseText — AI Text to Speech & MP3 Generator",
    description:
      "Turn your text into natural-sounding speech and download your MP3. No signup required.",
  },

  twitter: {
    card: "summary_large_image",
    title: "ProseText — AI Text to Speech & MP3 Generator",
    description:
      "Convert text into natural-sounding AI speech and download MP3 audio.",
  },

  alternates: {
    canonical: "https://prosetext.online",
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

            <main className="pt-16">
              {children}
            </main>

          <SiteFooter />  
        </div>
      </body>
    </html>
  );
}