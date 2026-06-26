import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AgentPay | AI-to-AI Micropayments",
  description: "A decentralized payment mesh for autonomous AI agents on the Stellar network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark antialiased">
      <body className="min-h-full bg-bg-primary text-white flex flex-col pt-16">
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#11141C",
              color: "#FFF",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            },
          }}
        />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
