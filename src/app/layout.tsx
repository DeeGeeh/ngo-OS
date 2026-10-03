import "@/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/client";
import { trpcConfig } from "@/trpc/config";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Nest", template: "%s · Nest" },
  description: "The operating system for non-profits.",
  applicationName: "Nest",
};

const clerkAppearance = { theme: shadcn };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const serverUrl = new URL(
    trpcConfig.endpoint,
    env.VERCEL_URL ? `https://${env.VERCEL_URL}` : env.APP_URL,
  ).href;
  const content = (
    <TRPCReactProvider serverUrl={serverUrl}>
      <TooltipProvider>{children}</TooltipProvider>
    </TRPCReactProvider>
  );

  return (
    <html
      lang="en"
      className={cn(inter.className, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
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
