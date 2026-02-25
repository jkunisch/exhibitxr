import { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D-Snap Bibliothek | Branchenlösungen für Produktpräsentation",
  description: "Entdecken Sie unsere 3D-Snap Lösungen für verschiedene Branchen. Vom Möbelhandel bis zur Industrie-Ersatzteil-Digitalisierung.",
};

export default function ThreeDSnapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
