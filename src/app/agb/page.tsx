import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
    title: "Allgemeine Geschäftsbedingungen | 3D-Snap",
    description: "AGB von 3D-Snap by ExhibitXR.",
};

export default function AGBPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl pt-32 pb-24">
                <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white">1. Geltungsbereich</h2>
                        <p>
                            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der
                                                         Plattform 3D-Snap (3d-snap.com) und aller damit verbundenen Dienste,                            betrieben von ExhibitXR.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">2. Leistungsumfang</h2>
                        <p>
                            3D-Snap bietet eine KI-gestützte Foto-zu-3D-Pipeline, einen
                            interaktiven 3D-Viewer und zugehörige Werkzeuge. Der genaue
                            Funktionsumfang richtet sich nach dem gewählten Plan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">3. Credit-System</h2>
                        <p>
                            Die Generierung von 3D-Modellen wird über ein Credit-System
                            abgerechnet. Credits sind im jeweiligen Plan enthalten oder können
                            einzeln erworben werden. Nicht genutzte Credits verfallen am Ende
                            des Abrechnungszeitraums.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">4. Nutzungsrechte</h2>
                        <p>
                            Generierte 3D-Modelle dürfen vom Nutzer kommerziell genutzt werden.
                            Das Urheberrecht an hochgeladenen Bildern verbleibt beim Nutzer.
                            ExhibitXR behält sich das Recht vor, anonymisierte Nutzungsdaten zur
                            Verbesserung des Dienstes zu verwenden.
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
