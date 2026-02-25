export type VariantTargetScope = "mesh" | "group" | "material";

export type ParsedVariantTarget = {
  scope: VariantTargetScope;
  value: string;
};

export type VariantMeshDescriptor = {
  meshName: string;
  groupNames: string[];
  materialNames: string[];
};

function normalizeTargetValue(value: string): string {
  return value.trim();
}

export function parseVariantTarget(rawTarget: string): ParsedVariantTarget | null {
  const raw = normalizeTargetValue(rawTarget);
  if (raw.length === 0) {
    return null;
  }

  const delimiterIndex = raw.indexOf(":");
  if (delimiterIndex === -1) {
    return { scope: "mesh", value: raw };
  }

  const rawScope = raw.slice(0, delimiterIndex).toLowerCase().trim();
  const value = normalizeTargetValue(raw.slice(delimiterIndex + 1));
  if (value.length === 0) {
    return null;
  }

  if (rawScope === "mesh" || rawScope === "group" || rawScope === "material") {
    return {
      scope: rawScope,
      value,
    };
  }

  return {
    scope: "mesh",
    value: raw,
  };
}

function matchesTargetValue(candidate: string, targetValue: string): boolean {
  if (targetValue === "*" || targetValue.toLowerCase() === "all") {
    return true;
  }

  return candidate === targetValue;
}

function descriptorMatchesTarget(
  descriptor: VariantMeshDescriptor,
  target: ParsedVariantTarget,
): boolean {
  if (target.scope === "mesh") {
    return matchesTargetValue(descriptor.meshName, target.value);
  }

  if (target.scope === "group") {
    return descriptor.groupNames.some((groupName) => matchesTargetValue(groupName, target.value));
  }

  return descriptor.materialNames.some((materialName) => matchesTargetValue(materialName, target.value));
}

export function resolveVariantTargetMeshNames(
  meshDescriptors: VariantMeshDescriptor[],
  explicitTargets: string[],
  autoTargetMeshNames: string[] = [],
): Set<string> {
  const selectedMeshNames = new Set(
    autoTargetMeshNames.map((meshName) => meshName.trim()).filter((meshName) => meshName.length > 0),
  );

  const parsedTargets = explicitTargets
    .map((target) => parseVariantTarget(target))
    .filter((target): target is ParsedVariantTarget => target !== null);

  for (const descriptor of meshDescriptors) {
    const isMatch = parsedTargets.some((target) => descriptorMatchesTarget(descriptor, target));
    if (isMatch) {
      selectedMeshNames.add(descriptor.meshName);
    }
  }

  return selectedMeshNames;
}
