import type { Metadata } from "next";
import GlbSizeChecker from "./GlbSizeChecker";

export const metadata: Metadata = {
    title: "GLB Dateigröße prüfen – 3D-Snap File-Size Checker",
    description:
        "Ziehe dein GLB-Modell hierher und erfahre sofort, ob es deine Shop-Performance killt. 100 % lokal im Browser.",
    robots: { index: true, follow: true },
};

export default function GlbSizeCheckerPage() {
    return <GlbSizeChecker />;
}
