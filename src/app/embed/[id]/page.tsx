import { demoConfig } from "@/data/demo";
import { parseExhibitConfig } from "@/lib/validateConfig";
import EmbedViewer from "@/components/3d/EmbedViewer";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;

  // For now, only the demo config is available.
  // In production this will load from Firestore by exhibit ID.
  if (id !== "demo") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#888",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Exhibit &quot;{id}&quot; not found.
      </div>
    );
  }

  // Validate config at render time
  const config = parseExhibitConfig(demoConfig);

  return <EmbedViewer config={config} />;
}