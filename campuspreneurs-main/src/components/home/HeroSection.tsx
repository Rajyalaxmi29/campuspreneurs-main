import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection({ frontImage, backImage }: { frontImage: string; backImage: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "/BackgroundSlider1.jpeg",
    "/BackgroundSlider2.JPG",
    "/BackgroundSlider3.JPG",
    "/BackgroundSlider4.jpeg",
    "/BackgroundSlider5.jpeg",
    "/BackgroundSlider6.jpeg",
    "/BackgroundSlider7.jpeg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        <img
          src={images[currentImageIndex]}
          alt="Background"
          className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        />
      </div>

      {/* Semi-transparent Overlay */}
      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(135deg, rgba(33, 37, 41, 0.3) 0%, rgba(33, 37, 41, 0.4) 100%)' }}></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 z-20">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-30">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-block">
              <span className="bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium">
                Chapter 1 — Innovation Begins Here
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-primary-foreground leading-tight animate-fade-in-up">
              Campuspreneurs
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-light animate-fade-in-up animation-delay-100">
              Turning Campus Challenges into Countable Change
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-200">
              <Button asChild variant="orange" size="xl">
                <Link to="/problems">
                  <FileText className="w-5 h-5" />
                  View Problems
                </Link>
              </Button>
              <Button asChild variant="orangeOutline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/registration">
                  Apply Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right - 3D Rotating Advertisement */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-80 h-80 lg:w-96 lg:h-96 perspective-1000">

              <div className="absolute inset-0 animate-rotate-3d preserve-3d">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-elevated backface-hidden">
                  <img src={frontImage} alt="Front" className="w-full h-full object-contain rounded-2xl" />
                </div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-elevated rotate-y-180 backface-hidden">
                  <img src={backImage} alt="Back" className="w-full h-full object-contain rounded-2xl" />
                </div>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
}
