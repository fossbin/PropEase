import PublicNavbar from '@/components/PublicNavbar';
import RoleNavbar from '@/components/RoleNavbar';
import GoogleMapsScript from '@/components/GoogleMapsScript';
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PropEase - Your Digital Solution",
  description: "A modern property app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen`}
      >
        <GoogleMapsScript />
        <PublicNavbar />
        <RoleNavbar />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
