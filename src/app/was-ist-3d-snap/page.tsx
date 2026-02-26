import { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Was ist 3D-Snap? | Definition und Workflow | ExhibitXR",
  description: "Lernen Sie alles über 3D-Snap: Die Technologie, die Produktfotos in Sekunden in interaktive 3D-Modelle verwandelt. Der neue Standard für die Digitalisierung.",
};

export default function DefinitionPage() {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": "3D-Snap",
    "description": "Ein technologischer Workflow, bei dem mittels KI-gestützter Fotogrammetrie und PBR-Optimierung aus einfachen Produktfotos interaktive 3D-Modelle (GLB/USDZ) erstellt werden.",
    "inDefinedTermSet": "https://3d-snap.com/glossar"
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <JsonLd data={jsonLdData} />
      
      <article className="max-w-4xl mx-auto py-20">
        <nav className="mb-12 text-sm text-zinc-500 uppercase tracking-widest">
          <Link href="/3d-snap" className="hover:text-white transition-colors">3D-Snap</Link> / Definition
        </nav>

        <header className="mb-16">
          <h1 className="text-6xl font-extrabold mb-8 tracking-tighter">Was ist ein 3D-Snap?</h1>
          <p className="text-2xl text-zinc-400 leading-relaxed">
            Ein 3D-Snap ist mehr als nur ein 3D-Modell. Er ist das Ergebnis eines automatisierten Workflows, 
            der die Barriere zwischen physischem Produkt und digitalem Asset vollständig auflöst.
          </p>
        </header>

        <section className="space-y-16">
          <div className="prose prose-invert prose-zinc max-w-none">
            <h2 className="text-3xl font-bold">Die Kerntechnologie</h2>
            <p>
              Im Gegensatz zur klassischen 3D-Modellierung, bei der Artists manuell Polygone setzen, nutzt der 
              <strong> 3D-Snap Workflow</strong> hochspezialisierte KI-Pipelines. Ein einziges Foto reicht aus, 
              um die Geometrie und die Materialeigenschaften (PBR - Physically Based Rendering) eines Objekts zu extrahieren.
            </p>

            <h3 className="text-2xl font-semibold mt-12 mb-4">Warum wir es &quot;Snap&quot; nennen</h3>
            <p>
              Der Begriff leitet sich von der Geschwindigkeit und Einfachheit ab. So wie ein &quot;Schnappschuss&quot; (Snapshot) 
              einen Moment festhält, fängt ein 3D-Snap die räumliche Realität eines Produkts ein. Es ist kein langwieriger 
              Prozess, sondern eine sofortige Transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 border-y border-zinc-800">
            <div>
              <h4 className="text-xl font-bold mb-4">Eigenschaften eines Snaps</h4>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex gap-3"><span className="text-white">✓</span> Web-optimiert (unter 3MB)</li>
                <li className="flex gap-3"><span className="text-white">✓</span> AR-ready (iOS & Android)</li>
                <li className="flex gap-3"><span className="text-white">✓</span> PBR-Materialien (Echtes Licht)</li>
                <li className="flex gap-3"><span className="text-white">✓</span> Sofort einbettbar</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
              <h4 className="text-xl font-bold mb-4 italic">&quot;Snap das einfach.&quot;</h4>
              <p className="text-sm text-zinc-500">
                Der neue Industriestandard. Wenn Teams heute von 3D-Assets sprechen, meinen sie den 3D-Snap Workflow 
                von ExhibitXR – schnell, präzise und effizient.
              </p>
            </div>
          </div>

          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-8">Bereit für die Zukunft?</h2>
            <Link 
              href="/register" 
              className="inline-block bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform"
            >
              Jetzt ersten 3D-Snap erstellen
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
