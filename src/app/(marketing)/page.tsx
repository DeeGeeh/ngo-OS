import { CloudShader } from "@/components/ui/cloud-shader";

import { ClosingCta } from "./_components/closing-cta";
import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Integrations } from "./_components/integrations";
import { SiteFooter } from "./_components/site-footer";
import { SiteNav } from "./_components/site-nav";

export default function HomePage() {
  return (
    <div className="relative min-h-svh w-full overflow-x-clip bg-primary">
      <CloudShader className="fixed inset-0" />
      <div className="relative z-10 pt-4">
        <SiteNav />
        <main>
          <Hero />
          <Features />
          <Integrations />
          <HowItWorks />
          <ClosingCta />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
