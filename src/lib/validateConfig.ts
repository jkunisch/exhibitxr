import { ExhibitConfigSchema, type ExhibitConfig } from "@/types/schema";

/**
 * Parse and validate an ExhibitConfig from unknown input.
 * Returns the typed config on success, throws with human-readable errors otherwise.
 */
export function parseExhibitConfig(input: unknown): ExhibitConfig {
    const result = ExhibitConfigSchema.safeParse(input);

    if (result.success) {
        return result.data;
    }

    const messages = result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `  • ${path}: ${issue.message}`;
    });

    throw new Error(
        `Invalid ExhibitConfig:\n${messages.join("\n")}`
    );
}