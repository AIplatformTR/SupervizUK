import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupervizAI — Clinical Supervision & Case Insights for UK Schools",
  description:
    "Confidential 4-step AI clinical supervision, plain-language case portfolios, and organisation-ready storage for UK educational and school psychologists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
