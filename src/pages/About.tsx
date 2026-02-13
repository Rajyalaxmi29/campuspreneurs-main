import { Layout } from "@/components/layout/Layout";
import { AboutSection } from "@/components/home/AboutSection";
import { TeamSection } from "@/components/home/TeamSection";

const About = () => {
  return (
    <Layout>
      <AboutSection />
      <TeamSection />
    </Layout>
  );
};

export default About;
