import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { EventsCarousel } from "@/components/home/EventsCarousel";
import { TimelineSection } from "@/components/home/TimelineSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection frontImage="/front.png" backImage="/back.png" />
      <EventsCarousel />
      <TimelineSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
