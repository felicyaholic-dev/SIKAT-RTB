import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { SplashScreen } from "@/components/SplashScreen";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "SIKAT RTB | Sistem Izin Keluar-Masuk",
  description: "Sistem Izin Keluar-Masuk Terintegrasi Rumah Talenta BCA.",
};

// Without this, mobile browsers use a desktop-width layout viewport and scale
// the whole application down. The responsive breakpoints can then never apply.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable}`}>
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
