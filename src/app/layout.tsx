import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "ExhibitXR — Interactive 3D Experiences",
    description: "B2B SaaS for interactive 3D product experiences in the browser.",
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
