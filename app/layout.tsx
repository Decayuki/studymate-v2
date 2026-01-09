import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MainNavigation } from "@/components/navigation/MainNavigation";
import { MobileOptimizations } from "@/components/ui/MobileOptimizations";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyMate - Hub de Création de Contenu Pédagogique",
  description: "Créez des cours, TDs et contrôles avec l'IA (Gemini & Claude)",
  viewport: "width=device-width, initial-scale=1.0",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudyMate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyMate" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        <MobileOptimizations>
          <MainNavigation />
          {children}
        </MobileOptimizations>
      </body>
    </html>
  );
}
