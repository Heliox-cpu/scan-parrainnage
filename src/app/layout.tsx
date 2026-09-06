import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCAN Parrainage",
  description: "Système de parrainage SCAN INSA Lyon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
