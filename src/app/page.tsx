/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Camera, Palette, MapPin, Link2, Smartphone, Zap, Check, ChevronRight } from "lucide-react";
import EmbedViewer from "@/components/3d/EmbedViewer";
import Navbar from "@/components/ui/Navbar";
import FadeIn from "@/components/ui/FadeIn";
import { demoConfig } from "@/data/demo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-[#00aaff]/30">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none blur-[120px] bg-gradient-to-b from-[#00aaff] to-transparent rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#00aaff] shadow-[0_0_8px_#00aaff]"></span>
                Foto → 3D in Minuten
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Mächtige Werkzeuge. <br className="hidden md:block" />
                Kinderleichte Bedienung.
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed font-medium">
                Foto hochladen → in 2–5 Minuten ein fertiges, texturiertes 3D‑Modell (GLB).
                Kein Blender. Keine 3D‑Kenntnisse nötig.
              </p>
              <p className="text-base text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Der einfachste Weg vom Foto zum fertigen 3D‑Modell – für Unternehmen und für dich.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="flex flex-col items-center justify-center">
                <Link
                  href="/register"
                  className="px-10 py-5 bg-[#00aaff] hover:bg-[#0088cc] text-white text-lg rounded-full font-semibold transition-all shadow-[0_0_30px_rgba(0,170,255,0.4)] hover:shadow-[0_0_40px_rgba(0,170,255,0.6)] flex items-center justify-center gap-3 group"
                >
                  Jetzt kostenlos testen
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Erstes Modell gratis · Keine Kreditkarte nötig
                </p>
              </div>
            </FadeIn>
          </div>

          {/* 3D Viewer Container */}
          <FadeIn delay={500} className="relative mx-auto w-full max-w-6xl rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 aspect-[4/3] md:aspect-[16/9] lg:h-[70vh] bg-black">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent pointer-events-none z-10 opacity-60" />
            <EmbedViewer config={demoConfig} enableChat={false} />

            {/* Viewer overlay label */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-xs font-medium text-white/80 flex items-center gap-2 pointer-events-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live-Demo
            </div>
            <div className="absolute bottom-3 left-4 z-20 text-[10px] text-white/30 pointer-events-none">
              * Beispielmodell zur Veranschaulichung
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Alles aus einer Hand.</h2>
              <p className="text-gray-400 text-lg">
                Vom Foto zum fertigen 3D‑Erlebnis – einbettbar, konfigurierbar, teilbar.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Camera className="w-6 h-6 text-[#00aaff]" />,
                title: "Foto → 3D‑Modell (KI)",
                desc: "Ein Foto hochladen und in Minuten ein sauberes, texturiertes 3D‑Modell (GLB) erhalten – für 3D‑Druck, Spiele, Prototypen oder schnelle Produkt‑Assets."
              },
              {
                icon: <Palette className="w-6 h-6 text-rose-400" />,
                title: "Konfigurator",
                desc: "Materialien und Farben live wechseln. Alle Varianten in einem Modell zeigen – perfekt zum Testen, Vergleichen und Präsentieren."
              },
              {
                icon: <MapPin className="w-6 h-6 text-purple-400" />,
                title: "Hotspots",
                desc: "Interaktive Info‑Punkte im 3D‑Raum platzieren – für Erklärungen, Anleitungen, Portfolios oder Produktseiten."
              },
              {
                icon: <Link2 className="w-6 h-6 text-emerald-400" />,
                title: "Einfach Einbinden",
                desc: "Per iFrame-Code auf jeder Website integrieren – so einfach wie ein YouTube-Video."
              },
              {
                icon: <Smartphone className="w-6 h-6 text-amber-400" />,
                title: "Voll Responsive",
                desc: "Optimiert für Desktop, Tablet und Smartphone mit Touch‑Gesten."
              },
              {
                icon: <Zap className="w-6 h-6 text-cyan-400" />,
                title: "Echtzeit‑Editor",
                desc: "Änderungen im Dashboard sind sofort in der Live‑Ansicht sichtbar."
              }
            ].map((feature, idx) => (
              <FadeIn key={idx} delay={idx * 100} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES / ANWENDUNGEN SECTION */}
      <section id="usecases" className="py-24 bg-black/50 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Grenzenlose Möglichkeiten</h2>
              <p className="text-gray-400 text-lg">
                3D‑Druck, Spieleentwicklung, Online‑Handel, Architektur, Bildung, Kunst – was immer du vorhast.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Objekte digitalisieren",
                desc: "Beliebige Gegenstände fotografieren und als texturiertes 3D‑Modell erhalten. Für Sammler, Macher und Neugierige.",
                img: "https://images.unsplash.com/photo-1633899306328-c5e70574aaa2?q=80&w=800&auto=format&fit=crop"
              },
              {
                title: "Produkte erlebbar machen",
                desc: "Interaktive 3D‑Viewer auf der eigenen Website einbinden. Kunden konfigurieren live – statt nur Bilder zu sehen.",
                img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop"
              },
              {
                title: "Vom Foto zum 3D‑Druck",
                desc: "GLB exportieren, in STL umwandeln, Druck starten. Ein schneller Weg vom Bild zum physischen Objekt.",
                img: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop"
              },
              {
                title: "Wissen sichtbar machen",
                desc: "Hotspots, Beschriftungen und geführte Touren machen komplexe Zusammenhänge greifbar – ob Maschine, Exponat oder Prototyp.",
                img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop"
              }
            ].map((item, idx) => (
              <FadeIn key={idx} delay={idx * 150} className="group relative rounded-2xl overflow-hidden border border-white/10">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Transparente Preise</h2>
              <p className="text-gray-400 text-lg">
                Wähle den Plan, der zu dir passt – oder starte gratis mit deinem ersten 3D‑Modell.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Free */}
            <FadeIn delay={0} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400 mb-2">Kostenlos</h3>
              <div className="text-4xl font-bold mb-6">0€ <span className="text-lg font-normal text-gray-500">/ Monat</span></div>
              <ul className="space-y-4 mb-8">
                {["1 Foto→3D‑Modell gratis", "1 Projekt", "Basis‑Editor", "Community‑Support", "Wasserzeichen"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-gray-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 px-6 text-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">
                Jetzt kostenlos testen
              </Link>
            </FadeIn>

            {/* Starter */}
            <FadeIn delay={150} className="bg-gradient-to-b from-white/10 to-white/5 border border-[#00aaff]/50 rounded-3xl p-8 backdrop-blur-sm relative shadow-[0_0_40px_rgba(0,170,255,0.15)] md:-mt-8 md:mb-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00aaff] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Empfohlen
              </div>
              <h3 className="text-xl font-medium text-[#00aaff] mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-6">29€ <span className="text-lg font-normal text-gray-400">/ Monat</span></div>
              <ul className="space-y-4 mb-8">
                {["10 Projekte", "Hotspots & Konfigurator", "Kein Wasserzeichen", "E‑Mail‑Support", "Analyse‑Dashboard", "Foto→3D als Zusatz buchbar"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200">
                    <Check className="w-5 h-5 text-[#00aaff] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 px-6 text-center rounded-xl bg-[#00aaff] hover:bg-[#0088cc] shadow-[0_0_15px_rgba(0,170,255,0.4)] transition-all font-medium">
                7 Tage kostenlos testen
              </Link>
            </FadeIn>

            {/* Pro */}
            <FadeIn delay={300} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-gray-400 mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">99€ <span className="text-lg font-normal text-gray-500">/ Monat</span></div>
              <ul className="space-y-4 mb-8">
                {["Unbegrenzte Projekte", "Foto→3D für Teams", "Eigene Domain", "Prioritäts‑Support", "API‑Zugriff", "Team‑Verwaltung"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-gray-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block w-full py-3 px-6 text-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">
                Kontakt aufnehmen
              </Link>
            </FadeIn>
          </div>

          <FadeIn delay={400}>
            <p className="text-center text-gray-500 text-sm mt-10 max-w-xl mx-auto">
              Foto→3D auch einzeln als Zusatz buchbar – ideal, wenn du kein Abo willst, aber regelmäßig Modelle brauchst.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-white mb-6 md:mb-0">
              3D-<span className="text-[#00aaff]">Snap</span>
            </Link>

            <div className="flex flex-wrap justify-center gap-8">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Impressum</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Datenschutz</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">AGB</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Kontakt</Link>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
            Made with <span className="text-red-500">❤️</span> in Mannheim
          </div>
        </div>
      </footer>
    </div>
  );
}
