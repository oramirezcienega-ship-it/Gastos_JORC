import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gastos JORC — Control Financiero",
  description: "Gestión inteligente de gastos, ingresos e inversiones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
