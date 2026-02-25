import { Metadata } from "next";
import { notFound } from "next/navigation";
import { industries } from "@/data/industries";
import IndustryPageClient from "./IndustryPageClient";

interface PageProps {
  params: Promise<{ industry: string }>;
}

export async function generateStaticParams() {
  return Object.keys(industries).map((industry) => ({
    industry,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry } = await params;
  const config = industries[industry];

  if (!config) return { title: "Branche nicht gefunden" };

  return {
    title: `3D-Snap für ${config.name} | ExhibitXR`,
    description: config.description,
  };
}

export default async function IndustryPage({ params }: PageProps) {
  const { industry } = await params;
  const config = industries[industry];

  if (!config) {
    notFound();
  }

  return <IndustryPageClient config={config} industry={industry} />;
}
