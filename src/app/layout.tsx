import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://3d-snap.com"),
    title: {
        default: "3D-Snap | Foto zu 3D Modell",
        template: "%s | 3D-Snap",
    },
    description: "Der einfachste Foto zu 3D Modell Generator für Creator, Maker und Industrie.",
    openGraph: {
        title: "3D-Snap | Foto zu 3D Modell",
        description: "Der einfachste Foto zu 3D Modell Generator für Creator, Maker und Industrie.",
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
            </body>
        </html>
    );
}
