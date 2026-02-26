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
      {
        slug: "stuhl",
        name: "Stühle & Sessel",
        description: "Kompakte 3D-Modelle für jedes Sitzmöbel.",
        snap_tips: [
          "Fotografieren Sie den Stuhl von allen Seiten auf Augenhöhe.",
          "Achten Sie auf die Beine – ein kontrastreicher Boden hilft der KI bei der Kantenerkennung.",
          "Bei Leder oder Samt: Vermeiden Sie direktes Blitzlicht, um Überstrahlungen zu verhindern."
        ],
        quality_targets: { fileSize: "< 2MB", polycount: "~ 12.000" },
        roi_defaults: { agencyTime: "1-2 Wochen", agencyCost: "400€ - 900€", snapTime: "25 Sekunden" },
        faq: [
          { question: "Werden feine Strukturen wie Stuhlbeine präzise erfasst?", answer: "Ja, unsere KI-Pipeline ist auf die Erkennung von Freiräumen und dünnen Strukturen spezialisiert." },
          { question: "Kann ich den Stuhl in verschiedenen Farben darstellen?", answer: "Absolut. Das 3D-Modell kann im Editor mit verschiedenen Material-Varianten (Stoff, Leder, Holz) belegt werden." }
        ]
      },
      {
        slug: "tisch",
        name: "Esstische & Beistelltische",
        description: "Präzise Oberflächen für Holz-, Glas- und Metalltische.",
        snap_tips: [
          "Bei Glastischen: Legen Sie eine Zeitung oder ein Muster unter das Glas, damit die KI die Tiefe erkennt.",
          "Fotografieren Sie die Tischkanten besonders scharf.",
          "Sorgen Sie für eine gleichmäßige Ausleuchtung der Tischplatte."
        ],
        quality_targets: { fileSize: "< 2.5MB", polycount: "~ 8.000" },
        roi_defaults: { agencyTime: "2-3 Wochen", agencyCost: "600€ - 1.500€", snapTime: "40 Sekunden" },
        faq: [
          { question: "Funktioniert 3D-Snap auch bei Glastischen?", answer: "Glatte, transparente Oberflächen sind eine Herausforderung. Mit unseren speziellen 'Glass-Mode' Tipps erzielen Sie jedoch exzellente Ergebnisse." },
          { question: "Ist das Modell maßstabsgetreu?", answer: "Ja, wenn Sie beim Upload ein Referenzmaß angeben, wird das Modell im korrekten Maßstab für AR-Anwendungen skaliert." }
        ]
      },
      {
        slug: "lampe",
        name: "Beleuchtung",
        description: "Lichtquellen und Lampenschirme detailgetreu snappen.",
        snap_tips: [
          "Fotografieren Sie die Lampe im ausgeschalteten Zustand.",
          "Bei glänzendem Metall (Chrom/Gold): Nutzen Sie indirektes Licht, um Reflektionen zu minimieren.",
          "Stellen Sie sicher, dass das Kabel ordentlich liegt oder entfernen Sie es später im Editor."
        ],
        quality_targets: { fileSize: "< 1.8MB", polycount: "~ 18.000" },
        roi_defaults: { agencyTime: "3-4 Wochen", agencyCost: "900€ - 2.000€", snapTime: "35 Sekunden" },
        faq: [
          { question: "Kann ich die Lichtwirkung im 3D-Modell simulieren?", answer: "Ja, im ExhibitXR Editor können Sie Lichtquellen definieren, die den Lampenschirm von innen beleuchten." },
          { question: "Wie werden durchsichtige Lampenschirme verarbeitet?", answer: "Unsere PBR-Materialien unterstützen Transparenz und Opazität für ein realistisches Rendering." }
        ]
      },
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
      {
        slug: "ring",
        name: "Ringe & Edelsteine",
        description: "Perfekte Lichtbrechung und Materialdarstellung.",
        snap_tips: [
          "Nutzen Sie einen Makro-Modus für maximale Schärfe auf kleinen Steinen.",
          "Verwenden Sie weißes, indirektes Licht, um Reflektionen zu kontrollieren.",
          "Platzieren Sie den Ring auf einem einfarbigen, kontrastreichen Untergrund."
        ],
        quality_targets: { fileSize: "< 1.5MB", polycount: "~ 25.000" },
        roi_defaults: { agencyTime: "4-6 Wochen", agencyCost: "1.500€ - 3.500€", snapTime: "45 Sekunden" },
        faq: [
          { question: "Werden Brillantschliffe bei Edelsteinen korrekt dargestellt?", answer: "Ja, unsere PBR-Pipeline unterstützt Lichtbrechung und Refraktion für Edelstein-Materialien." },
          { question: "Eignet sich das Modell für virtuelle Anprobe?", answer: "Absolut. Alle Modelle werden so skaliert, dass sie direkt für AR Try-On Apps genutzt werden können." }
        ]
      },
      {
        slug: "halskette",
        name: "Halsketten",
        description: "Filigrane Strukturen in 3D festhalten.",
        snap_tips: [
          "Breiten Sie die Kette flach aus, ohne dass Glieder sich überlagern.",
          "Nutzen Sie eine weiche Lichtbox, um Schatten im filigranen Metall zu vermeiden.",
          "Vermeiden Sie direktes Blitzlicht, um ein 'Ausbrennen' der Metallreflexionen zu verhindern."
        ],
        quality_targets: { fileSize: "< 2MB", polycount: "~ 30.000" },
        roi_defaults: { agencyTime: "3-5 Wochen", agencyCost: "1.200€ - 2.800€", snapTime: "60 Sekunden" },
        faq: [
          { question: "Wie geht das System mit feinen Gliedern um?", answer: "Wir optimieren die Mesh-Dichte automatisch, um filigrane Strukturen bei gleichzeitig geringer Dateigröße zu erhalten." },
          { question: "Können verschiedene Längenvarianten erstellt werden?", answer: "Im Editor können Sie das Basis-Modell anpassen und Texturen für Gold, Silber oder Roségold zuweisen." }
        ]
      },
    ],
  },
  elektronik: {
    slug: "elektronik",
    name: "Unterhaltungselektronik",
    description: "3D-Produktdarstellung für Gadgets, Smartphones und Hardware.",
    heroModelUrl: "",
    categories: [
      {
        slug: "smartphone",
        name: "Smartphones",
        description: "Präzise 3D-Abbilder moderner Consumer-Elektronik.",
        snap_tips: [
          "Achten Sie darauf, dass der Bildschirm beim Fotografieren dunkel bleibt.",
          "Fotografieren Sie die Kanten und Anschlüsse besonders detailliert.",
          "Vermeiden Sie Fingerabdrücke auf dem Gehäuse vor dem Snap."
        ],
        quality_targets: { fileSize: "< 1.2MB", polycount: "~ 10.000" },
        roi_defaults: { agencyTime: "2-4 Wochen", agencyCost: "800€ - 1.800€", snapTime: "30 Sekunden" },
        faq: [
          { question: "Kann der Bildschirm im 3D-Modell beleuchtet werden?", answer: "Ja, Sie können im Editor eine eigene Textur für das Display hochladen und diese als 'Emissive Map' leuchten lassen." },
          { question: "Werden glänzende Rückseiten korrekt verarbeitet?", answer: "Ja, unsere KI erkennt spiegelnde Oberflächen und weist ihnen physikalisch korrekte Reflexionswerte zu." }
        ]
      },
      {
        slug: "kopfhoerer",
        name: "Audio & Kopfhörer",
        description: "Komplexe Formen und Materialien perfekt gesnappt.",
        snap_tips: [
          "Sorgen Sie für gleichmäßiges Licht, damit auch dunkle Stellen erkennbar bleiben.",
          "Fotografieren Sie die Polster aus verschiedenen Winkeln, um die Textur zu erfassen.",
          "Nutzen Sie einen neutralen Ständer, um den Kopfhörer in Form zu halten."
        ],
        quality_targets: { fileSize: "< 1.5MB", polycount: "~ 15.000" },
        roi_defaults: { agencyTime: "1-3 Wochen", agencyCost: "600€ - 1.400€", snapTime: "35 Sekunden" },
        faq: [
          { question: "Eignen sich die Modelle für Explosionszeichnungen?", answer: "Das System erstellt ein geschlossenes Mesh. Für Explosionszeichnungen können wir auf Anfrage separate Bauteile generieren." },
          { question: "Wird die Leder-Textur der Polster übernommen?", answer: "Absolut. Das PBR-Material bildet feine Poren und die Haptik des Leders visuell exakt nach." }
        ]
      },
      {
        slug: "laptop",
        name: "Laptops & Tablets",
        description: "Flache Gehäuse und Displayflächen in 3D.",
        snap_tips: [
          "Fotografieren Sie den Laptop in einem 90-Grad Winkel geöffnet.",
          "Vermeiden Sie direkte Reflexionen auf dem Display während des Snaps.",
          "Nutzen Sie eine flache, kontrastreiche Unterlage."
        ],
        quality_targets: { fileSize: "< 1.4MB", polycount: "~ 12.000" },
        roi_defaults: { agencyTime: "3-5 Wochen", agencyCost: "1.000€ - 2.500€", snapTime: "45 Sekunden" },
        faq: [
          { question: "Können Tastatur-Beschriftungen gelesen werden?", answer: "Ja, bei guter Ausleuchtung werden die Tastaturen in hoher Auflösung gebacken, sodass Beschriftungen scharf bleiben." },
          { question: "Ist der Öffnungswinkel im 3D-Viewer anpassbar?", answer: "Ja, im Editor können Sie die Gelenke definieren, um den Laptop interaktiv zu öffnen und zu schließen." }
        ]
      },
    ],
  },
  industrie: {
    slug: "industrie",
    name: "Industrie & Technik",
    description: "3D-Assets für Maschinenbau, Ersatzteile und Werkzeuge.",
    heroModelUrl: "",
    categories: [
      {
        slug: "werkzeug",
        name: "Handwerkzeuge",
        description: "Robuste 3D-Modelle für Profi-Equipment.",
        snap_tips: [
          "Nutzen Sie einen neutralen Untergrund, um Metall-Reflexionen zu stabilisieren.",
          "Achten Sie auf Schärfe bei Griff-Texturen und Markierungen.",
          "Fotografieren Sie das Werkzeug aus einem 45-Grad-Winkel von oben."
        ],
        quality_targets: { fileSize: "< 1.5MB", polycount: "~ 12.000" },
        roi_defaults: { agencyTime: "1-2 Wochen", agencyCost: "400€ - 800€", snapTime: "20 Sekunden" },
        faq: [
          { question: "Ist das Modell für Produktkonfiguratoren geeignet?", answer: "Ja, alle Modelle werden im gLTF/GLB Standard ausgegeben und sind sofort kompatibel mit Web-Konfiguratoren." },
          { question: "Werden technische Details wie Skalen korrekt erfasst?", answer: "Bei scharfer Vorlage können wir Millimeter-Skalen und technische Gravuren hochauflösend abbilden." }
        ]
      },
      {
        slug: "bauteil",
        name: "Ersatzteile",
        description: "Präzise Geometrien für technische Komponenten.",
        snap_tips: [
          "Verwenden Sie ein Stativ für maximale Präzision bei kleinen Bohrungen.",
          "Achten Sie auf gleichmäßige Beleuchtung der Innenseiten von Bauteilen.",
          "Nutzen Sie einen einfarbigen, nicht-reflektierenden Untergrund."
        ],
        quality_targets: { fileSize: "< 2MB", polycount: "~ 18.000" },
        roi_defaults: { agencyTime: "2-4 Wochen", agencyCost: "600€ - 1.500€", snapTime: "40 Sekunden" },
        faq: [
          { question: "Wie genau sind die Abmessungen des 3D-Modells?", answer: "Mit einer Referenz-Skalierung erreichen wir eine Genauigkeit im Millimeterbereich – ideal für visuelle Ersatzteilkataloge." },
          { question: "Können die Modelle im CAD-System weiterverarbeitet werden?", answer: "Das GLB-Format ist primär für die Visualisierung gedacht, kann aber in Programme wie Blender oder Fusion 360 importiert werden." }
        ]
      },
      {
        slug: "maschine",
        name: "Kompaktmaschinen",
        description: "Visualisierung technischer Anlagen in Sekunden.",
        snap_tips: [
          "Sorgen Sie für eine 360-Grad-Begehbarkeit der Maschine beim Fotografieren.",
          "Nutzen Sie einen Weitwinkel-Modus für große Gehäuse, aber achten Sie auf Verzerrungen.",
          "Markieren Sie markante Fixpunkte auf dem Boden, um die Kameratrackung zu unterstützen."
        ],
        quality_targets: { fileSize: "< 5MB", polycount: "~ 40.000" },
        roi_defaults: { agencyTime: "4-8 Wochen", agencyCost: "2.000€ - 5.000€", snapTime: "120 Sekunden" },
        faq: [
          { question: "Können Maschinen mit glänzenden Oberflächen gesnappt werden?", answer: "Ja, wir empfehlen hier die Nutzung eines Polarisationsfilters, um Spiegelungen zu reduzieren." },
          { question: "Kann man in das Innere der Maschine blicken?", answer: "Das System erfasst primär die äußere Geometrie. Für Innenansichten müssen separate Snaps erstellt werden." }
        ]
      },
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
      {
        slug: "handtasche",
        name: "Handtaschen",
        description: "Ledertexturen und Details in Highend-Qualität.",
        snap_tips: [
          "Füllen Sie die Tasche aus, damit sie ihre natürliche Form behält.",
          "Nutzen Sie weiches Licht, um die Haptik des Leders oder Stoffes zu betonen.",
          "Verwenden Sie einen neutralen, hellen Hintergrund."
        ],
        quality_targets: { fileSize: "< 1.8MB", polycount: "~ 15.000" },
        roi_defaults: { agencyTime: "2-3 Wochen", agencyCost: "800€ - 1.500€", snapTime: "35 Sekunden" },
        faq: [
          { question: "Bleiben Texturen wie Krokodilleder scharf?", answer: "Ja, unsere Pipeline nutzt Hochauflösende Texturbäckerei, um feinste Porenstrukturen realistisch darzustellen." },
          { question: "Wird die Hardware (Schnallen, Logos) glänzend dargestellt?", answer: "Absolut. Das PBR-System erkennt metallische Applikationen und verleiht ihnen physikalisch korrekte Reflexionen." }
        ]
      },
      {
        slug: "brille",
        name: "Brillen & Eyewear",
        description: "Virtuelle Anprobe-Assets direkt aus dem Snap-Workflow.",
        snap_tips: [
          "Fotografieren Sie die Brille in aufgeklapptem Zustand auf einem Kopf-Dummy oder einem Ständer.",
          "Nutzen Sie indirektes Licht, um Lichtreflexe auf den Gläsern zu minimieren.",
          "Achten Sie auf maximale Schärfe der Bügelgelenke."
        ],
        quality_targets: { fileSize: "< 1.2MB", polycount: "~ 12.000" },
        roi_defaults: { agencyTime: "2-4 Wochen", agencyCost: "700€ - 1.800€", snapTime: "40 Sekunden" },
        faq: [
          { question: "Können Sehstärken oder Tönungen simuliert werden?", answer: "Ja, im Editor können Sie die Transparenz und Tönung der Gläser (z.B. für Sonnenbrillen) stufenlos anpassen." },
          { question: "Ist die Brille für Virtual Try-On bereit?", answer: "Ja, wir exportieren die Modelle in Formaten, die von gängigen AR-VTO-Frameworks unterstützt werden." }
        ]
      },
    ],
  },
  home: {
    slug: "home",
    name: "Home & Decor",
    description: "Dekoration und Wohnaccessoires in 3D zum Leben erwecken.",
    heroModelUrl: "",
    categories: [
      {
        slug: "vase",
        name: "Vasen & Gefäße",
        description: "Keramik- und Glasoberflächen in Perfektion.",
        snap_tips: [
          "Bei Glas: Füllen Sie die Vase mit farbigem Wasser, um die Lichtbrechung zu visualisieren.",
          "Verwenden Sie einen hellen, kontrastreichen Hintergrund für Keramik.",
          "Achten Sie auf Schärfe bei handgemalten Dekoren."
        ],
        quality_targets: { fileSize: "< 1.5MB", polycount: "~ 10.000" },
        roi_defaults: { agencyTime: "1-3 Wochen", agencyCost: "500€ - 1.200€", snapTime: "25 Sekunden" },
        faq: [
          { question: "Werden handgefertigte Strukturen (z.B. Ton-Strukturen) erkannt?", answer: "Ja, unsere KI-Pipeline kann feinste organische Texturen originalgetreu im Normal-Map-Verfahren abbilden." },
          { question: "Können Glasvasen transparent dargestellt werden?", answer: "Ja, wir nutzen hierfür spezielle Alpha-Blending-Verfahren im Viewer für photorealistisches Glas." }
        ]
      },
      {
        slug: "skulptur",
        name: "Dekofiguren",
        description: "Kunstvolle Objekte in Sekunden dreidimensional erfassen.",
        snap_tips: [
          "Nutzen Sie einen Drehteller für eine gleichmäßige Erfassung von allen Seiten.",
          "Achten Sie auf weiches, diffuses Licht, um harte Schatten in den Details zu vermeiden.",
          "Fotografieren Sie die Skulptur aus verschiedenen Höhenwinkeln (30°, 60°)."
        ],
        quality_targets: { fileSize: "< 3.5MB", polycount: "~ 25.000" },
        roi_defaults: { agencyTime: "3-5 Wochen", agencyCost: "1.200€ - 3.000€", snapTime: "60 Sekunden" },
        faq: [
          { question: "Bleiben feine Gravuren bei Metall-Skulpturen sichtbar?", answer: "Dank High-Resolution Texture Baking bleiben auch filigrane Oberflächenstrukturen erhalten." },
          { question: "Ist das Modell für Web-Animationen geeignet?", answer: "Absolut. Das Modell ist optimiert für R3F und gängige Web-Animation-Libraries." }
        ]
      },
    ],
  },
  beauty: {
    slug: "beauty",
    name: "Beauty & Kosmetik",
    description: "Premium-Darstellung für Pflege- und Kosmetikprodukte.",
    heroModelUrl: "",
    categories: [
      {
        slug: "parfuem",
        name: "Parfümflakons",
        description: "Glasbrechung und Luxus-Packaging in 3D.",
        snap_tips: [
          "Verwenden Sie indirektes Licht, um Reflektionen auf Glasflakons zu minimieren.",
          "Achten Sie auf scharfe Kanten bei Logos und Beschriftungen.",
          "Nutzen Sie eine helle Box für eine saubere Freistellung."
        ],
        quality_targets: { fileSize: "< 1.4MB", polycount: "~ 15.000" },
        roi_defaults: { agencyTime: "3-5 Wochen", agencyCost: "900€ - 2.200€", snapTime: "40 Sekunden" },
        faq: [
          { question: "Werden goldene Prägungen auf dem Flakon korrekt dargestellt?", answer: "Ja, unsere Material-KI erkennt metallische Finishes und stellt diese mit korrekten Reflexionswerten dar." },
          { question: "Können wir das Modell für E-Commerce-Shopify nutzen?", answer: "Ja, die GLB-Datei kann direkt in Shopify-Produktseiten hochgeladen werden." }
        ]
      },
      {
        slug: "lippenstift",
        name: "Make-up",
        description: "Präzise Farben und metallische Oberflächen.",
        snap_tips: [
          "Fotografieren Sie den Lippenstift in herausgedrehtem Zustand.",
          "Nutzen Sie weiches Licht, um die Samtigkeit der Textur zu betonen.",
          "Vermeiden Sie Fingerabdrücke auf der Hülse."
        ],
        quality_targets: { fileSize: "< 1.0MB", polycount: "~ 8.000" },
        roi_defaults: { agencyTime: "1-2 Wochen", agencyCost: "400€ - 800€", snapTime: "15 Sekunden" },
        faq: [
          { question: "Können wir Farbvarianten (Shades) automatisch generieren?", answer: "Ja, im Editor können Sie auf Basis eines Snaps unbegrenzt viele Farb-Variationen für die Lippenstift-Textur erstellen." },
          { question: "Ist das Modell AR-fähig für Social Media?", answer: "Absolut. Das optimierte Modell kann direkt in Spark AR (Instagram/Facebook) oder Lens Studio (Snapchat) importiert werden." }
        ]
      },
    ],
  },
};
