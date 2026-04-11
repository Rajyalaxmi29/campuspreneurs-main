import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, FileText, Edit, Save, X, Plus, Trash2, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HeroContent {
  chipText: string;
  title: string;
  subtitle: string;
  frontImage: string;
  backImage: string;
  sliderImages: string[];
}

const defaultHeroContent: HeroContent = {
  chipText: "Chapter 1 — Innovation Begins Here",
  title: "inCamp",
  subtitle: "Turning Campus Challenges into Countable Change",
  frontImage: "/front.png",
  backImage: "/back.png",
  sliderImages: [
    "/BackgroundSlider1.jpeg",
    "/BackgroundSlider2.JPG",
    "/BackgroundSlider3.JPG",
    "/BackgroundSlider4.jpeg",
    "/BackgroundSlider5.jpeg",
    "/BackgroundSlider6.jpeg",
    "/BackgroundSlider7.jpeg",
  ],
};

export function HeroSection() {
  const { isAdmin } = useAdmin();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  const [editContent, setEditContent] = useState<HeroContent>(defaultHeroContent);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [cardAspectRatio, setCardAspectRatio] = useState(1.25);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const { data, error } = await supabase
          .from("page_content")
          .select("*")
          .eq("page_name", "home")
          .eq("section_key", "hero")
          .maybeSingle();

        if (!error && data?.content) {
          const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
          setHeroContent(parsed);
          setEditContent(parsed);
        }
      } catch (error) {
        console.error("Failed to load hero content:", error);
      }
    };

    loadHero();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroContent.sliderImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroContent.sliderImages.length]);

  const saveHeroContent = async () => {
    setSaving(true);
    try {
      const entry = {
        page_name: "home",
        section_key: "hero",
        content: editContent,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("page_content").upsert([entry], {
        onConflict: ["page_name", "section_key"],
      });
      if (error) throw error;
      setHeroContent(editContent);
      setEditing(false);
      toast.success("Hero content updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save hero content.");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (field: keyof Pick<HeroContent, "frontImage" | "backImage">, file: File) => {
    setUploadingFor(field);
    try {
      const sanitized = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const filePath = `home_hero_images/${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = await supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      setEditContent((current) => ({ ...current, [field]: urlData.publicUrl }));
      toast.success("Image uploaded successfully.");
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      toast.error(error?.message || "Unable to upload image.");
    } finally {
      setUploadingFor(null);
    }
  };

  const uploadSliderImage = async (file: File) => {
    setUploadingFor("slider");
    try {
      const sanitized = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const filePath = `home_slider_images/${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = await supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      setEditContent((current) => ({
        ...current,
        sliderImages: [...current.sliderImages, urlData.publicUrl],
      }));
      toast.success("Slider image added.");
    } catch (error: any) {
      console.error("Failed to upload slider image:", error);
      toast.error(error?.message || "Unable to upload slider image.");
    } finally {
      setUploadingFor(null);
    }
  };

  const removeSliderImage = (index: number) => {
    setEditContent((current) => ({
      ...current,
      sliderImages: current.sliderImages.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroContent.sliderImages[currentImageIndex]}
          alt="Background"
          className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
        />
      </div>

      {/* Semi-transparent Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: "linear-gradient(135deg, rgba(33, 37, 41, 0.3) 0%, rgba(33, 37, 41, 0.4) 100%)" }}
      ></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 z-20">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-30">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-block">
              <span className="bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium">
                {heroContent.chipText}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-primary-foreground leading-tight animate-fade-in-up">
              {heroContent.title}
            </h1>

            <p className="text-xl md:text-2xl text-primary-foreground/90 font-light animate-fade-in-up animation-delay-100">
              {heroContent.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-200">
              <Button asChild variant="orange" size="xl">
                <Link to="/problems">
                  <FileText className="w-5 h-5" />
                  View Problems
                </Link>
              </Button>
              <Button
                asChild
                variant="orangeOutline"
                size="xl"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Link to="/registration">
                  Apply Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {isAdmin && !editing && (
              <Button onClick={() => setEditing(true)} variant="orange" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Hero Section
              </Button>
            )}
          </div>

          {/* Right - 3D Rotating Advertisement */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-[26rem] lg:max-w-[32rem] perspective-1000"
              style={{ paddingTop: `${100 / cardAspectRatio}%` }}
            >
              <div className="absolute inset-0 animate-rotate-3d preserve-3d">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-elevated backface-hidden overflow-hidden">
                  <img
                    src={heroContent.frontImage}
                    alt="Front"
                    className="w-full h-full object-contain"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      const ratio = img.naturalWidth / img.naturalHeight;
                      if (ratio > 0) setCardAspectRatio(ratio);
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-white rounded-2xl shadow-elevated rotate-y-180 backface-hidden overflow-hidden">
                  <img
                    src={heroContent.backImage}
                    alt="Back"
                    className="w-full h-full object-contain"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      const ratio = img.naturalWidth / img.naturalHeight;
                      if (ratio > 0) setCardAspectRatio(ratio);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="mt-10 bg-white/95 rounded-[2rem] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">Chip text</label>
                <Input
                  value={editContent.chipText}
                  onChange={(e) => setEditContent({ ...editContent, chipText: e.target.value })}
                />

                <label className="block text-sm font-medium text-foreground">Title</label>
                <Input
                  value={editContent.title}
                  onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                />

                <label className="block text-sm font-medium text-foreground">Subtitle</label>
                <Textarea
                  value={editContent.subtitle}
                  onChange={(e) => setEditContent({ ...editContent, subtitle: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Front image</label>
                  <div className="mt-2 flex items-center gap-4">
                    <img src={editContent.frontImage} alt="Front preview" className="w-24 h-24 rounded-xl object-cover border" />
                    <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-slate-100">
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      {uploadingFor === "frontImage" ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) uploadImage("frontImage", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">Back image</label>
                  <div className="mt-2 flex items-center gap-4">
                    <img src={editContent.backImage} alt="Back preview" className="w-24 h-24 rounded-xl object-cover border" />
                    <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-slate-100">
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      {uploadingFor === "backImage" ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) uploadImage("backImage", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground">Background slider images</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {editContent.sliderImages.map((image, index) => (
                  <div key={image} className="rounded-xl border border-border overflow-hidden bg-slate-50">
                    <img src={image} alt={`Slider ${index + 1}`} className="w-full h-40 object-cover" />
                    <div className="flex items-center justify-between p-3">
                      <span className="text-sm text-muted-foreground">Image {index + 1}</span>
                      <button
                        type="button"
                        className="text-sm text-destructive"
                        onClick={() => removeSliderImage(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm hover:bg-slate-100">
                  <Upload className="w-4 h-4" />
                  {uploadingFor === "slider" ? "Uploading..." : "Add slider image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) uploadSliderImage(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button onClick={saveHeroContent} disabled={saving} variant="orange" size="sm">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Hero"}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setEditContent(heroContent);
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

