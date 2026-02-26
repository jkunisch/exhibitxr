import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
    title: "Kontakt | 3D-Snap",
    description: "Kontaktieren Sie das 3D-Snap Team.",
};

export default function KontaktPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl pt-32 pb-24">
                <h1 className="text-4xl font-bold mb-8">Kontakt</h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
                    <p>
                        Sie haben Fragen zu 3D-Snap oder möchten eine Demo für Ihr Unternehmen?
                        Wir freuen uns über Ihre Nachricht.
                    </p>

                    <section className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                        <h2 className="text-xl font-semibold text-white mb-4">E-Mail</h2>
                        <a
                            href="mailto:kontakt@3d-snap.com"
                            className="text-[#00aaff] hover:underline text-lg"
                        >
                            kontakt@3d-snap.com
                        </a>
                    </section>

                    <section className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                        <h2 className="text-xl font-semibold text-white mb-4">Standort</h2>
                        <p>
                            ExhibitXR<br />
                            Mannheim, Deutschland
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
