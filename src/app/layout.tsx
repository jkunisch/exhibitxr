import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "3D-Snap | Foto zu 3D Modell",
    description: "Der einfachste Foto zu 3D Modell Generator für Creator, Maker und E-Commerce.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de">
            <body className={`${inter.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
