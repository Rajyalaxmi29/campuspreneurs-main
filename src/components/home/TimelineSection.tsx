import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Award,
  Check,
  Edit,
  Plus,
  Rocket,
  Save,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

interface TimelineCard {
  id: string;
  name: string;
  title: string;
  description: string;
  icon_url?: string | null;
}

interface TimelineHeader {
  label: string;
  title: string;
  subtitle: string;
  photo_url?: string | null;
}

const fallbackIcons = [Target, Users, Rocket, Check, Award];

const defaultTimelineHeader: TimelineHeader = {
  label: "Event Journey",
  title: "Your Path to Innovation",
  subtitle: "",
  photo_url: null,
};

const defaultTimelineCards: TimelineCard[] = [
  {
    id: "phase-0",
    name: "Phase 0",
    title: "Problem Discovery",
    description: "Identify and document real campus challenges through observation and research.",
  },
  {
    id: "phase-1",
    name: "Phase 1",
    title: "Team Formation & Registration",
    description: "Form cross-functional teams and register with your chosen problem statement.",
  },
  {
    id: "phase-2",
    name: "Phase 2",
    title: "Solution Ideation",
    description: "Brainstorm, validate, and refine your innovative solution approach.",
  },
  {
    id: "phase-3",
    name: "Phase 3",
    title: "Prototype Development",
    description: "Build working prototypes and prepare comprehensive documentation.",
  },
  {
    id: "phase-4",
    name: "Phase 4",
    title: "Final Pitch & Evaluation",
    description: "Present your solution to the jury and compete for recognition and prizes.",
  },
];

export function TimelineSection() {
  const { isAdmin } = useAdmin();
  const [cards, setCards] = useState<TimelineCard[]>(defaultTimelineCards);
  const [editCards, setEditCards] = useState<TimelineCard[]>(defaultTimelineCards);
  const [header, setHeader] = useState<TimelineHeader>(defaultTimelineHeader);
  const [editHeader, setEditHeader] = useState<TimelineHeader>(defaultTimelineHeader);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIconId, setUploadingIconId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [{ data: cardData, error: cardError }, { data: headerData, error: headerError }] =
          await Promise.all([
            supabase
              .from("page_content")
              .select("*")
              .eq("page_name", "home")
              .eq("section_key", "timeline_cards")
              .maybeSingle(),
            supabase
              .from("page_content")
              .select("*")
              .eq("page_name", "home")
              .eq("section_key", "timeline_header")
              .maybeSingle(),
          ]);

        if (!cardError && cardData?.content) {
          const parsed = typeof cardData.content === "string" ? JSON.parse(cardData.content) : cardData.content;
          setCards(parsed);
          setEditCards(parsed);
        } else {
          setCards(defaultTimelineCards);
          setEditCards(defaultTimelineCards);
        }

        if (!headerError && headerData?.content) {
          const parsed = typeof headerData.content === "string" ? JSON.parse(headerData.content) : headerData.content;
          const normalized = {
            ...defaultTimelineHeader,
            ...parsed,
          };
          setHeader(normalized);
          setEditHeader(normalized);
        } else {
          setHeader(defaultTimelineHeader);
          setEditHeader(defaultTimelineHeader);
        }
      } catch (error) {
        console.error("Failed to load timeline content:", error);
        setCards(defaultTimelineCards);
        setEditCards(defaultTimelineCards);
        setHeader(defaultTimelineHeader);
        setEditHeader(defaultTimelineHeader);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const saveCards = async () => {
    setSaving(true);
    try {
      const cardEntry = {
        page_name: "home",
        section_key: "timeline_cards",
        content: editCards,
        updated_at: new Date().toISOString(),
      };

      const headerEntry = {
        page_name: "home",
        section_key: "timeline_header",
        content: editHeader,
        updated_at: new Date().toISOString(),
      };

      const { error: cardsError } = await supabase.from("page_content").upsert([cardEntry], {
        onConflict: ["page_name", "section_key"],
      });
      if (cardsError) throw cardsError;

      const { error: headerError } = await supabase.from("page_content").upsert([headerEntry], {
        onConflict: ["page_name", "section_key"],
      });
      if (headerError) throw headerError;

      setCards(editCards);
      setHeader(editHeader);
      setEditing(false);
      toast.success("Home timeline updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save home timeline.");
    } finally {
      setSaving(false);
    }
  };

  const updateCard = (id: string, field: keyof TimelineCard, value: string) => {
    setEditCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const addCard = () => {
    setEditCards((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: `Phase ${current.length}`,
        title: "New Phase",
        description: "Describe the next step in the journey.",
        icon_url: null,
      },
    ]);
  };

  const removeCard = (id: string) => {
    setEditCards((current) => current.filter((card) => card.id !== id));
  };

  const uploadIcon = async (id: string, file: File) => {
    setUploadingIconId(id);
    try {
      const sanitized = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const filePath = `home_timeline_icons/${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      updateCard(id, "icon_url", urlData.publicUrl);
      toast.success("Icon uploaded successfully.");
    } catch (error: any) {
      console.error("Failed to upload icon:", error);
      toast.error(error?.message || "Unable to upload icon.");
    } finally {
      setUploadingIconId(null);
    }
  };

  const uploadHeaderPhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const sanitized = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const filePath = `home_timeline_header/${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      setEditHeader((current) => ({ ...current, photo_url: urlData.publicUrl }));
      toast.success("Header photo uploaded successfully.");
    } catch (error: any) {
      console.error("Failed to upload header photo:", error);
      toast.error(error?.message || "Unable to upload header photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeHeaderPhoto = () => {
    setEditHeader((current) => ({ ...current, photo_url: undefined }));
  };

  const displayedCards = editing ? editCards : cards;

  return (
    <section className="py-20 lg:py-28 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-secondary font-medium text-sm uppercase tracking-wider">
            {editing ? (
              <Input
                value={editHeader.label}
                onChange={(e) => setEditHeader({ ...editHeader, label: e.target.value })}
                className="mx-auto max-w-2xl text-center uppercase tracking-wider"
              />
            ) : (
              header.label
            )}
          </span>
          {editing ? (
            <div className="space-y-4">
              <Input
                value={editHeader.title}
                onChange={(e) => setEditHeader({ ...editHeader, title: e.target.value })}
                className="mx-auto max-w-2xl text-center"
              />
              <Textarea
                value={editHeader.subtitle}
                onChange={(e) => setEditHeader({ ...editHeader, subtitle: e.target.value })}
                className="mx-auto max-w-2xl text-center min-h-[100px]"
                placeholder="Optional subtitle"
              />
              <div className="flex flex-col items-center gap-3">
                {editHeader.photo_url ? (
                  <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border shadow-sm">
                    <img
                      src={editHeader.photo_url}
                      alt="Timeline header photo"
                      className="w-full object-cover aspect-[16/9]"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-3xl aspect-[16/9] rounded-3xl bg-slate-100 border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                    No photo uploaded
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm hover:bg-slate-100">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? "Uploading..." : "Upload center photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) uploadHeaderPhoto(e.target.files[0]);
                      }}
                    />
                  </label>
                  {editHeader.photo_url && (
                    <Button variant="outline" size="sm" onClick={removeHeaderPhoto}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-3 text-3xl lg:text-4xl font-poppins font-bold text-foreground">
                {header.title}
              </h2>
              {header.subtitle && (
                <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                  {header.subtitle}
                </p>
              )}
              {header.photo_url && (
                <div className="mt-8 flex justify-center">
                  <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border shadow-sm">
                    <img
                      src={header.photo_url}
                      alt="Timeline photo"
                      className="w-full object-cover aspect-[16/9]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isAdmin && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {editing ? (
                <>
                  <Button onClick={saveCards} disabled={saving} variant="orange" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Journey"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      setEditCards(cards);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} variant="orange" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Journey Cards
                </Button>
              )}
            </div>
          )}
        </div>

        {editing && (
          <div className="mb-12 space-y-6">
            {editCards.map((card, index) => {
              const Icon = fallbackIcons[index % fallbackIcons.length];
              return (
                <Card key={card.id} className="border border-border bg-card shadow-card">
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          {card.icon_url ? (
                            <img
                              src={card.icon_url}
                              alt={card.title}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <Icon className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={card.name}
                            onChange={(e) => updateCard(card.id, "name", e.target.value)}
                            placeholder="Phase label"
                          />
                          <Input
                            value={card.title}
                            onChange={(e) => updateCard(card.id, "title", e.target.value)}
                            placeholder="Card title"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-slate-100">
                          <Upload className="w-4 h-4 inline-block mr-2" />
                          {uploadingIconId === card.id ? "Uploading..." : "Upload Icon"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                uploadIcon(card.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <Button variant="destructive" size="sm" onClick={() => removeCard(card.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={card.description}
                      onChange={(e) => updateCard(card.id, "description", e.target.value)}
                      placeholder="Card description"
                      className="min-h-[120px]"
                    />
                  </CardContent>
                </Card>
              );
            })}
            <div className="flex justify-center">
              <Button onClick={addCard} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Journey Card
              </Button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 w-0.5 bg-border lg:-translate-x-1/2" />

            {displayedCards.map((phase, index) => {
              const isEven = index % 2 === 0;
              const Icon = fallbackIcons[index % fallbackIcons.length];

              return (
                <div
                  key={phase.id}
                  className={`relative flex items-center gap-6 mb-8 lg:mb-12 ${
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="absolute left-6 lg:left-1/2 lg:-translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center z-10">
                    {phase.icon_url ? (
                      <img src={phase.icon_url} alt={phase.title} className="w-6 h-6 object-contain" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>

                  <div
                    className={`ml-20 lg:ml-0 lg:w-[calc(50%-3rem)] ${
                      isEven ? "lg:mr-auto lg:pr-8" : "lg:ml-auto lg:pl-8"
                    }`}
                  >
                    <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow">
                      <span className="text-secondary font-medium text-sm">{phase.name}</span>
                      <h3 className="mt-1 font-poppins font-semibold text-xl text-foreground">
                        {phase.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm">{phase.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
