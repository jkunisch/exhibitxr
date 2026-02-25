import type { ExhibitConfig } from "@/types/schema";

const WALL_PRODUCT_KEYWORDS = [
  "wall",
  "wall-mounted",
  "wall mount",
  "wallmount",
  "wand",
  "wandmontage",
  "wandlampe",
  "wandleuchte",
  "wandregal",
  "wandspiegel",
  "wall lamp",
  "wall shelf",
  "wall mirror",
  "wall art",
] as const;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").trim();
}

export function isWallProduct(config: Pick<ExhibitConfig, "title" | "model">): boolean {
  const searchableValues = [config.title, config.model.label, config.model.id]
    .map((value) => normalizeText(value))
    .join(" ");

  return WALL_PRODUCT_KEYWORDS.some((keyword) => searchableValues.includes(keyword));
}

