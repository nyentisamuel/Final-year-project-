"use client";
import { VotingProvider } from "../lib/voting-context";
import ThemeProvider from "@/components/theme-provider";
import ModeToggle from "@/components/mode-toggler";
import { SessionProvider } from "next-auth/react";

export default function App({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="absolute m-4 right-0">
          <ModeToggle />
        </div>
        <VotingProvider>{children}</VotingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
