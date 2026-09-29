import { MotherDuckClientProvider } from "@/lib/motherduck/context/motherduckClientContext";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MotherDuck WASM Demo",
  description: "Interactive analytics powered by MotherDuck WASM and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen flex flex-col antialiased`}
      >
        <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
            <Image
              src="/motherduck_logo.png"
              alt="MotherDuck"
              width={140}
              height={28}
              priority
            />
            <nav className="flex items-center gap-1 sm:gap-2">
              <a
                href="https://github.com/motherduckdb/nextjs-motherduck-wasm-analytics-quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Repo
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </a>
              <a
                href="https://motherduck.com/docs/sql-reference/wasm-client/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-accent"
              >
                Docs
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <MotherDuckClientProvider database="sample_data">
            {children}
          </MotherDuckClientProvider>
        </main>
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://motherduck.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            MotherDuck
          </a>{" "}
          WASM Client &mdash; data cached and queried entirely in your browser
        </footer>
      </body>
    </html>
  );
}
