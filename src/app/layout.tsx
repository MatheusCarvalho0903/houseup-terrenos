import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HouseUp | Banco de Terrenos",
  description: "Sistema interno de gestão do banco de terrenos da HouseUp Construtora.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface-muted">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#1A2E4A",
              color: "#fff",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#4FA3E0", secondary: "#fff" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
