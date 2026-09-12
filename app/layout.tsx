import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/authContext";
import PwaManager from "@/components/PwaManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ScamWatch — Your Digital Guardian",
  description: "ScamWatch checks suspicious messages and lets you loop in someone you trust before you act.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScamWatch",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliq.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        {/* Subtle Pro Max ambient glows */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl filter" />
          <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl filter" />
          <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl filter" />
        </div>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <PwaManager />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
