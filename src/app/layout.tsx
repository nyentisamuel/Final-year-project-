import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import App from "@/components/app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fingerprint Voting System",
  description: "A secure voting system with fingerprint authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <App>{children}</App>
      </body>
    </html>
  );
}
