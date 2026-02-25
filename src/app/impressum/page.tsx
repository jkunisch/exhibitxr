import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
    title: "Impressum | 3D-Snap",
    description: "Impressum und rechtliche Angaben von 3D-Snap by ExhibitXR.",
};

export default function ImpressumPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl pt-32 pb-24">
                <h1 className="text-4xl font-bold mb-8">Impressum</h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white">Angaben gemäß § 5 TMG</h2>
                        <p>
                            ExhibitXR<br />
                            Jonatan Kunisch<br />
                            Mannheim, Deutschland
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">Kontakt</h2>
                        <p>
                            E-Mail: kontakt@3dsnap.de
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">Haftungsausschluss</h2>
                        <p>
                            Die Inhalte dieser Seite werden mit größtmöglicher Sorgfalt erstellt.
                            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
                            jedoch keine Gewähr übernehmen.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10">
                    <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Zurück zur Startseite
                    </Link>
                </div>
            </main>
        </div>
    );
}
