import "@/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/env";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = { title: "NGO OS" };

const clerkAppearance = { theme: shadcn };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <TooltipProvider>{children}</TooltipProvider>;

  return (
    <html lang="en" className={inter.className}>
      <body className={inter.variable}>
        {env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider appearance={clerkAppearance}>{content}</ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
