import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/theme-provider";

export const metadata: Metadata = {
  title: "{{PROJECT_NAME}}",
  description: "Built with the Vandslab starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
