import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Save, X, Plus, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface PageHeader {
  title: string;
  subtitle: string;
  teamTitle: string;
  teamSubtitle: string;
}

interface PageDescription {
  paragraphs: string[];
  fontStyle: "default" | "serif" | "mono" | "italic";
}

interface AboutCard {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
}

const defaultHeader: PageHeader = {
  title: "What is inCamp?",
  subtitle:
    "inCamp is a student-driven innovation challenge designed to identify, analyse, and solve real-world problems within the campus ecosystem. We believe every challenge holds the seed of transformation.",
  teamTitle: "The Team",
  teamSubtitle: "Behind inCamp",
};

const defaultDescription: PageDescription = {
  paragraphs: [
    "inCamp is a student-driven innovation challenge designed to identify, analyse, and solve real-world problems within the campus ecosystem. We believe every challenge holds the seed of transformation.",
    "Through our structured 5D Framework — Discover, Define, Design, Develop, and Deliver — participants journey from problem identification to prototype creation, gaining invaluable entrepreneurial skills along the way.",
  ],
  fontStyle: "default",
};

const defaultTeamCards: AboutCard[] = [
  {
    id: "geenovate",
    title: "Geenovate Foundation",
    description:
      "The driving force behind inCamp, fostering innovation and entrepreneurship across GCET.",
    image_url: null,
  },
  {
    id: "patrons",
    title: "Patrons & Leadership",
    description:
      "Chairman, Director, and institutional leaders providing vision and guidance.",
    image_url: null,
  },
  {
    id: "core",
    title: "Core Organisers",
    description:
      "Head Coordinator and 5 Co-Coordinators managing event operations and participant experience.",
    image_url: null,
  },
  {
    id: "support",
    title: "Department Support Group",
    description:
      "Academic supporters from each department ensuring curriculum alignment and mentorship.",
    image_url: null,
  },
  {
    id: "partners",
    title: "Partner Clubs & Councils",
    description:
      "Innovation Council, Tech Clubs, and professional bodies collaborating for success.",
    image_url: null,
  },
  {
    id: "volunteers",
    title: "Volunteers & Sponsors",
    description:
      "Dedicated student volunteers and external sponsors making this event possible.",
    image_url: null,
  },
];

const fontClasses: Record<PageDescription["fontStyle"], string> = {
  default: "",
  serif: "font-serif",
  mono: "font-mono",
  italic: "italic",
};

export default function About() {
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [header, setHeader] = useState<PageHeader>(defaultHeader);
  const [description, setDescription] = useState<PageDescription>(defaultDescription);
  const [teamCards, setTeamCards] = useState<AboutCard[]>(defaultTeamCards);

  const [editHeader, setEditHeader] = useState<PageHeader>(defaultHeader);
  const [editDescription, setEditDescription] = useState<PageDescription>(defaultDescription);
  const [editTeamCards, setEditTeamCards] = useState<AboutCard[]>(defaultTeamCards);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("page_content").select("*").eq("page_name", "about");

      if (data) {
        const headerRow = data.find((row) => row.section_key === "header");
        const descriptionRow = data.find((row) => row.section_key === "description");
        const cardsRow = data.find((row) => row.section_key === "team_cards");

        if (headerRow) {
          const parsed = typeof headerRow.content === "string" ? JSON.parse(headerRow.content) : headerRow.content;
          setHeader(parsed);
          setEditHeader(parsed);
        }

        if (descriptionRow) {
          const parsed = typeof descriptionRow.content === "string" ? JSON.parse(descriptionRow.content) : descriptionRow.content;
          setDescription(parsed);
          setEditDescription(parsed);
        }

        if (cardsRow) {
          const parsed = typeof cardsRow.content === "string" ? JSON.parse(cardsRow.content) : cardsRow.content;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeamCards(parsed);
            setEditTeamCards(parsed);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load About page content:", error);
      toast.error("Unable to load About page content.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = [
        {
          page_name: "about",
          section_key: "header",
          content: editHeader,
          updated_at: new Date().toISOString(),
        },
        {
          page_name: "about",
          section_key: "description",
          content: editDescription,
          updated_at: new Date().toISOString(),
        },
        {
          page_name: "about",
          section_key: "team_cards",
          content: editTeamCards,
          updated_at: new Date().toISOString(),
        },
      ];

      const { error } = await supabase.from("page_content").upsert(entries, {
        onConflict: ["page_name", "section_key"],
      });

      if (error) throw error;

      setHeader(editHeader);
      setDescription(editDescription);
      setTeamCards(editTeamCards);
      setEditing(false);
      toast.success("About page content updated successfully.");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error?.message || "Failed to save About page content.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditHeader(header);
    setEditDescription(description);
    setEditTeamCards(teamCards);
    setEditing(false);
  };

  const addTeamCard = () => {
    setEditTeamCards((current) => [
      ...current,
      {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        title: "",
        description: "",
        image_url: null,
      },
    ]);
  };

  const removeTeamCard = (id: string) => {
    setEditTeamCards((current) => current.filter((card) => card.id !== id));
  };

  const updateTeamCard = (id: string, field: keyof AboutCard, value: string) => {
    setEditTeamCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const uploadCardImage = async (id: string, file: File) => {
    setUploadingImage(true);
    try {
      const sanitized = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const filePath = `about_cards/${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      updateTeamCard(id, "image_url", urlData.publicUrl);
      toast.success("Image uploaded successfully.");
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      toast.error(error?.message || "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </Layout>
    );
  }

  const descriptionClass = fontClasses[description.fontStyle];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-primary py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.20),transparent_35%)]" />
        <div className="relative container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
              <div className="text-center">
                <span className="text-secondary font-medium text-sm uppercase tracking-wider">
                  About The Event
                </span>
                {editing ? (
                  <div className="mt-3 space-y-4">
                    <Input
                      value={editHeader.title}
                      onChange={(e) => setEditHeader({ ...editHeader, title: e.target.value })}
                      placeholder="Page heading"
                      className="bg-white text-foreground"
                    />
                    <Textarea
                      value={editHeader.subtitle}
                      onChange={(e) => setEditHeader({ ...editHeader, subtitle: e.target.value })}
                      placeholder="Page subtitle"
                      className="min-h-[140px] bg-white text-foreground"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="mt-3 text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
                      {header.title}
                    </h2>
                    <div className={`mt-4 space-y-4 text-primary-foreground/80 text-lg leading-relaxed ${descriptionClass}`}>
                      {description.paragraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </>
                )}

                {isAdmin && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {editing ? (
                      <>
                        <Button onClick={handleSave} disabled={saving || uploadingImage} variant="orange" size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button onClick={handleCancel} variant="orange" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setEditing(true)} variant="orange" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Content
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {editing && (
                <div className="mt-10 bg-slate-50 rounded-3xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Description Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Paragraph 1</label>
                      <Textarea
                        value={editDescription.paragraphs[0] || ""}
                        onChange={(e) =>
                          setEditDescription((current) => ({
                            ...current,
                            paragraphs: [e.target.value, current.paragraphs[1] ?? ""],
                          }))
                        }
                        className="min-h-[120px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Paragraph 2</label>
                      <Textarea
                        value={editDescription.paragraphs[1] || ""}
                        onChange={(e) =>
                          setEditDescription((current) => ({
                            ...current,
                            paragraphs: [current.paragraphs[0] ?? "", e.target.value],
                          }))
                        }
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">Font style for description</label>
                    <select
                      value={editDescription.fontStyle}
                      onChange={(e) =>
                        setEditDescription((current) => ({
                          ...current,
                          fontStyle: e.target.value as PageDescription["fontStyle"],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="default">Default</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>
              )}

          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            {editing ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <Input
                  value={editHeader.teamTitle}
                  onChange={(e) => setEditHeader({ ...editHeader, teamTitle: e.target.value })}
                  placeholder="Section title"
                />
                <Input
                  value={editHeader.teamSubtitle}
                  onChange={(e) => setEditHeader({ ...editHeader, teamSubtitle: e.target.value })}
                  placeholder="Section subtitle"
                />
              </div>
            ) : (
              <>
                <span className="text-secondary font-medium text-sm uppercase tracking-wider">
                  {header.teamTitle}
                </span>
                <h2 className="mt-3 text-3xl lg:text-4xl font-poppins font-bold text-foreground">
                  {header.teamSubtitle}
                </h2>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {(editing ? editTeamCards : teamCards).map((card) => (
              <Card key={card.id} className="overflow-hidden shadow-card hover:shadow-elevated transition-all">
                <CardContent className="p-6">
                  {editing ? (
                    <div className="space-y-4">
                      <div className="h-44 rounded-2xl bg-slate-100 overflow-hidden relative">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.title || "Team card image"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                            <ImagePlus className="w-8 h-8 mb-2" />
                            Upload image for about us card
                          </div>
                        )}
                      </div>
                      <Input
                        value={card.title}
                        onChange={(e) => updateTeamCard(card.id, "title", e.target.value)}
                        placeholder="Card title"
                      />
                      <Textarea
                        value={card.description}
                        onChange={(e) => updateTeamCard(card.id, "description", e.target.value)}
                        placeholder="Card description"
                        className="min-h-[100px]"
                      />
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Card image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              uploadCardImage(card.id, e.target.files[0]);
                            }
                          }}
                          className="block w-full text-sm text-foreground"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamCard(card.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove card
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="h-44 rounded-2xl bg-slate-100 overflow-hidden mb-5">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                            No image uploaded
                          </div>
                        )}
                      </div>
                      <h3 className="font-poppins font-semibold text-lg text-foreground">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-muted-foreground text-sm">{card.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {editing && (
            <div className="flex justify-center">
              <Button onClick={addTeamCard} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add card
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
