import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidSense — Semantic Video Intelligence & RAG Assistant",
  description:
    "Turn any YouTube video into an interactive knowledge base with semantic retrieval, grounded answers, and timestamp-based sources.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`} suppressHydrationWarning>
      <body 
        className="min-h-full flex flex-col bg-[#080b14] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );

}
