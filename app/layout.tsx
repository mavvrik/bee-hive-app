import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Hive",
  description: "Riviera Beach 115 performance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}