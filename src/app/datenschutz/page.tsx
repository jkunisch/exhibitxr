import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
    title: "Datenschutzerklärung | 3D-Snap",
    description: "Datenschutzerklärung von 3D-Snap by ExhibitXR.",
};

export default function DatenschutzPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl pt-32 pb-24">
                <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>

                <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-semibold text-white">1. Verantwortlicher</h2>
                        <p>
                            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
                            ExhibitXR — Jonatan Kunisch, Mannheim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">2. Erhobene Daten</h2>
                        <p>
                            Wir erheben und verarbeiten personenbezogene Daten nur im Rahmen der
                            gesetzlichen Bestimmungen (DSGVO, BDSG). Dazu gehören:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Registrierungsdaten (E-Mail-Adresse)</li>
                            <li>Nutzungsdaten (Seitenaufrufe, Interaktionen)</li>
                            <li>Hochgeladene Bilder zur 3D-Modell-Generierung</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">3. Hosting & Drittanbieter</h2>
                        <p>
                            Diese Website wird über Vercel (USA) gehostet. Für die 3D-Generierung werden
                            Bilder an Drittanbieter-APIs übermittelt. Nutzerdaten werden in Google Firebase
                            (EU-Region) gespeichert.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white">4. Ihre Rechte</h2>
                        <p>
                            Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und
                            Einschränkung der Verarbeitung Ihrer personenbezogenen Daten. Kontaktieren
                                                         Sie uns unter kontakt@3d-snap.com.                        </p>
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
