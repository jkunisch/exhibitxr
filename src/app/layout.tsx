import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/ui/Analytics";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL("https://3d-snap.com"),
    title: {
        default: "3D-Snap | Foto zu 3D Modell",
        template: "%s | 3D-Snap",
    },
    description: "Der einfachste Weg vom Foto zum 3D-Modell.",
    openGraph: {
        title: "3D-Snap | Foto zu 3D Modell",
        description: "Der einfachste Weg vom Foto zum 3D-Modell.",
        siteName: "3D-Snap",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "3D-Snap Logo" }],
        type: "website",
        locale: "de_DE",
    },
    twitter: {
        card: "summary_large_image",
        title: "3D-Snap | Foto zu 3D Modell",
        description: "Der einfachste Foto zu 3D Modell Generator.",
        images: ["/og-image.png"],
    },
    icons: {
        icon: [
            { url: "/icon.png", type: "image/png" },
            { url: "/favicon.ico", sizes: "any" },
        ],
        shortcut: ["/favicon.ico"],
        apple: [{ url: "/apple-icon.png", type: "image/png" }],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" data-scroll-behavior="smooth">
            <body className={`${inter.variable} antialiased`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
