import { prisma } from "@/lib/db/prisma";

export const landingVariantValues = ["default", "cooitza"] as const;
export type LandingVariant = (typeof landingVariantValues)[number];

const LANDING_VARIANT_KEY = "landingVariant";
const DEFAULT_VARIANT: LandingVariant = "default";

export function parseLandingVariant(value: string | null | undefined): LandingVariant {
  if (value === "cooitza") {
    return "cooitza";
  }

  return DEFAULT_VARIANT;
}

export async function getActiveLandingVariant() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: LANDING_VARIANT_KEY },
      select: { value: true },
    });

    return parseLandingVariant(setting?.value);
  } catch {
    return DEFAULT_VARIANT;
  }
}

export const landingVariantKey = LANDING_VARIANT_KEY;
