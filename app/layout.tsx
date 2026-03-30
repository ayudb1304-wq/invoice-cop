import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://invoicecop.com"
  ),
  title: {
    default:
      "InvoiceCop – Automated Invoice Reminder Sequences for Freelancers",
    template: "%s | InvoiceCop",
  },
  description:
    "Stop chasing late invoices manually. InvoiceCop sends AI-powered, scheduled reminder emails with payment links — and stops automatically when clients pay or reply.",
  keywords: [
    "invoice reminder automation",
    "freelancer invoice follow up",
    "automated payment reminder email",
    "invoice reminder software",
    "get paid on time freelancer",
    "overdue invoice email sequence",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://invoicecop.com",
    siteName: "InvoiceCop",
    title: "InvoiceCop – Automated Invoice Reminders That Get You Paid",
    description:
      "Automated, polite invoice reminder sequences for freelancers. Set it once, get paid faster.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceCop – Stop Chasing Late Payments",
    description:
      "Automated invoice reminder sequences. Works with any invoicing tool.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        manrope.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
