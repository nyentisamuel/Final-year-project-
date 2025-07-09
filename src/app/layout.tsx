import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ChatProvider } from "@/lib/chat-context";
import { ChatWidget } from "@/components/chat-widget";
import "./globals.css";
import App from "@/components/app";
import {
  FpjsProvider,
  FingerprintJSPro,
} from "@fingerprintjs/fingerprintjs-pro-react";

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
  console.log(FingerprintJSPro.defaultScriptUrlPattern);
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <FpjsProvider
          loadOptions={{
            apiKey: "B4vH7tx3Vcj17mKH3ZCp",
          }}
        >
          <App>
            <ChatProvider>
              {children}
              <ChatWidget />
            </ChatProvider>
          </App>
        </FpjsProvider>
      </body>
    </html>
  );
}
