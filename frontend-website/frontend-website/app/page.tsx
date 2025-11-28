import { HeroShell } from "@/components/Hero/HeroShell";
import { HowItWorks } from "@/components/Sections/HowItWorks";
import { MarketplacePreview } from "@/components/Sections/MarketplacePreview";
import { TrustBanner } from "@/components/Sections/TrustBanner";
import { Footer } from "@/components/Sections/Footer";
import { PageReveal } from "@/components/UI/PageReveal";
import { ScrollProgress } from "@/components/UI/ScrollProgress";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black-primary">
      <ScrollProgress />
      <PageReveal>
        <HeroShell />
        <HowItWorks />
        <MarketplacePreview />
        <TrustBanner />
        <Footer />
      </PageReveal>
    </main>
  );
}
