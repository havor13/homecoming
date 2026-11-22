import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Homecoming",
  description: "A community for returned missionaries.",
  appleWebApp: { capable: true, title: "Homecoming", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0e6b5b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <SiteFooter />
        <RegisterSW />
      </body>
    </html>
  );
}
