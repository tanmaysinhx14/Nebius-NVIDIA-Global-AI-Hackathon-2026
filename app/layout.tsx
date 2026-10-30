import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracekit — Debug with a little more clarity",
  description: "A model-tiered student debugging copilot with Tavily search before proposed fixes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
