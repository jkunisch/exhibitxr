export interface CategoryConfig {
  slug: string;
  name: string;
  description: string;
  modelUrl?: string;
  snap_tips?: string[];
  quality_targets?: {
    fileSize: string;
    polycount: string;
  };
  roi_defaults?: {
    agencyTime: string;
    agencyCost: string;
    snapTime: string;
  };
  faq?: Array<{ question: string; answer: string }>;
}

export interface IndustryConfig {
  slug: string;
  name: string;
  description: string;
  heroModelUrl: string;
  categories: CategoryConfig[];
}

export const industries: Record<string, IndustryConfig> = {
  moebel: {
    slug: "moebel",
    name: "Möbel & Interior",
    description: "Transformieren Sie Produktfotos von Möbeln in interaktive 3D-Modelle für Ihre Präsentation.",
    heroModelUrl: "",
    categories: [
      {
        slug: "sofa",
        name: "Sofas & Couches",
        description: "Präsentieren Sie Polstermöbel in fotorealistischem 3D.",
        snap_tips: [
          "Nutzen Sie weiches, diffuses Licht, um die Textur des Stoffes hervorzuheben.",
          "Vermeiden Sie harte Schatten unter dem Sofa.",
          "Fotografieren Sie leicht von schräg oben (ca. 30 Grad Winkel)."
        ],
        quality_targets: { fileSize: "< 3MB", polycount: "~ 15.000" },
        roi_defaults: { agencyTime: "2-4 Wochen", agencyCost: "800€ - 2.500€", snapTime: "30 Sekunden" },
        faq: [
          { question: "Wie lange dauert es, ein 3D Modell für ein Sofa zu erstellen?", answer: "Mit 3D-Snap dauert die Erstellung eines commerce-ready 3D-Modells für ein Sofa weniger als 2 Minuten." },
          { question: "Werden Stofftexturen realistisch übernommen?", answer: "Ja, unsere Pipeline nutzt PBR-Materialien, um Stoffstrukturen und Lichtreflexionen exakt nachzubilden." }
        ]
      },
      { slug: "stuhl", name: "Stühle & Sessel", description: "Kompakte 3D-Modelle für jedes Sitzmöbel." },
      { slug: "tisch", name: "Esstische & Beistelltische", description: "Präzise Oberflächen für Holz-, Glas- und Metalltische." },
      { slug: "lampe", name: "Beleuchtung", description: "Lichtquellen und Lampenschirme detailgetreu snappen." },
    ],
  },
  schmuck: {
    slug: "schmuck",
    name: "Uhren & Schmuck",
    description: "High-Fidelity 3D-Modelle für Luxusartikel und Accessoires.",
    heroModelUrl: "",
    categories: [
      {
        slug: "armbanduhr",
        name: "Armbanduhren",
        description: "Detailsichtbarkeit für Uhrengehäuse und Armbänder.",
        snap_tips: [
          "Verwenden Sie einen Makro-Modus, wenn möglich.",
          "Reduzieren Sie harte Reflexionen auf dem Ziffernblatt durch polarisiertes Licht."
        ],
        quality_targets: { fileSize: "< 2MB", polycount: "~ 20.000" },
        roi_defaults: { agencyTime: "3-5 Wochen", agencyCost: "1.200€ - 3.000€", snapTime: "45 Sekunden" },
        faq: [
          { question: "Eignet sich 3D-Snap für glänzendes Metall?", answer: "Absolut. Das System erkennt metallische Oberflächen und weist ihnen physikalisch korrekte Reflexionswerte zu." }
        ]
      },
      { slug: "ring", name: "Ringe & Edelsteine", description: "Perfekte Lichtbrechung und Materialdarstellung." },
      { slug: "halskette", name: "Halsketten", description: "Filigrane Strukturen in 3D festhalten." },
    ],
  },
  elektronik: {
    slug: "elektronik",
    name: "Unterhaltungselektronik",
    description: "3D-Produktdarstellung für Gadgets, Smartphones und Hardware.",
    heroModelUrl: "",
    categories: [
      { slug: "smartphone", name: "Smartphones", description: "Präzise 3D-Abbilder moderner Consumer-Elektronik." },
      { slug: "kopfhoerer", name: "Audio & Kopfhörer", description: "Komplexe Formen und Materialien perfekt gesnappt." },
      { slug: "laptop", name: "Laptops & Tablets", description: "Flache Gehäuse und Displayflächen in 3D." },
    ],
  },
  industrie: {
    slug: "industrie",
    name: "Industrie & Technik",
    description: "3D-Assets für Maschinenbau, Ersatzteile und Werkzeuge.",
    heroModelUrl: "",
    categories: [
      { slug: "werkzeug", name: "Handwerkzeuge", description: "Robuste 3D-Modelle für Profi-Equipment." },
      { slug: "bauteil", name: "Ersatzteile", description: "Präzise Geometrien für technische Komponenten." },
      { slug: "maschine", name: "Kompaktmaschinen", description: "Visualisierung technischer Anlagen in Sekunden." },
    ],
  },
  fashion: {
    slug: "fashion",
    name: "Fashion & Lifestyle",
    description: "Interaktive Mode-Erlebnisse durch schnelle 3D-Snaps.",
    heroModelUrl: "",
    categories: [
      {
        slug: "sneaker",
        name: "Sneaker & Schuhe",
        description: "Der neue Standard für die digitale Produktpräsentation.",
        snap_tips: [
          "Fotografieren Sie den Schuh aus dem klassischen 45-Grad Winkel.",
          "Sorgen Sie für einen gleichmäßigen, einfarbigen Hintergrund."
        ],
        quality_targets: { fileSize: "< 1.5MB", polycount: "~ 10.000" },
        roi_defaults: { agencyTime: "1-2 Wochen", agencyCost: "500€ - 1.200€", snapTime: "25 Sekunden" },
        faq: [
          { question: "Können 3D-Sneaker in AR betrachtet werden?", answer: "Ja, aus jedem gesnappten Schuh generieren wir automatisch einen QR-Code für iOS Quick Look und Android AR." }
        ]
      },
      { slug: "handtasche", name: "Handtaschen", description: "Ledertexturen und Details in Highend-Qualität." },
      { slug: "brille", name: "Brillen & Eyewear", description: "Virtuelle Anprobe-Assets direkt aus dem Snap-Workflow." },
    ],
  },
  home: {
    slug: "home",
    name: "Home & Decor",
    description: "Dekoration und Wohnaccessoires in 3D zum Leben erwecken.",
    heroModelUrl: "",
    categories: [
      { slug: "vase", name: "Vasen & Gefäße", description: "Keramik- und Glasoberflächen in Perfektion." },
      { slug: "skulptur", name: "Dekofiguren", description: "Kunstvolle Objekte in Sekunden dreidimensional erfassen." },
    ],
  },
  beauty: {
    slug: "beauty",
    name: "Beauty & Kosmetik",
    description: "Premium-Darstellung für Pflege- und Kosmetikprodukte.",
    heroModelUrl: "",
    categories: [
      { slug: "parfuem", name: "Parfümflakons", description: "Glasbrechung und Luxus-Packaging in 3D." },
      { slug: "lippenstift", name: "Make-up", description: "Präzise Farben und metallische Oberflächen." },
    ],
  },
};
