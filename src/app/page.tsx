import HighlightsCarousel from '@/components/HighlightsCarousel';
import CertificationSection from '@/components/sections/CertificationSection';
import SdgSharedLayoutWheel from '@/components/sdg-wheel/SdgSharedLayoutWheel';
import EventsSection from '@/components/sections/EventsSection';
import TeamSection from '@/components/sections/TeamSection';

export default function HomePage() {
  return (
    <div className="flex flex-col bg-[#F8F7F4] text-[#334155]">
      {/* Section 1: Full-Viewport Immersive Hero Slider (#hero) */}
      <HighlightsCarousel />

      {/* Section 2: 3-Step Certification Pathway & Inline Certificate Lookup (#certification) */}
      <CertificationSection />

      {/* Section 3: Interactive UN SDG Alignment Wheel (#sdg-alignment) */}
      <section className="border-b border-[#E2DFD7] bg-white">
        <SdgSharedLayoutWheel />
      </section>

      {/* Section 4: Events & Impact Gallery with Interactive Album Modal (#events) */}
      <EventsSection />

      {/* Section 5: Institutional Leadership & 11 SDG Ambassadors (#team) */}
      <TeamSection />
    </div>
  );
}
