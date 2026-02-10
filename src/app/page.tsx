import { PublicHome } from "@/components/public-home";
import { getActiveLandingVariant } from "@/lib/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const landingVariant = await getActiveLandingVariant();

  return <PublicHome variant={landingVariant} />;
}
