import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Mail, Phone, MapPin, User, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface Coordinator {
  role: string;
  name: string;
  email: string;
  phone: string;
}

interface GeneralInfo {
  email: string;
  phone: string;
  address: string;
}

export default function Contact() {
  const { isAdmin } = useAdmin();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editCoordinators, setEditCoordinators] = useState<Coordinator[]>([]);
  const [editGeneralInfo, setEditGeneralInfo] = useState<GeneralInfo>({
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_name", "contact");

    if (data) {
      const coordData = data.find((d) => d.section_key === "coordinators");
      const infoData = data.find((d) => d.section_key === "general_info");

      if (coordData) {
        const parsed = typeof coordData.content === "string" 
          ? JSON.parse(coordData.content) 
          : coordData.content;
        setCoordinators(parsed);
        setEditCoordinators(parsed);
      }
      if (infoData) {
        const parsed = typeof infoData.content === "string" 
          ? JSON.parse(infoData.content) 
          : infoData.content;
        setGeneralInfo(parsed);
        setEditGeneralInfo(parsed);
      }
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from("page_content")
        .update({ content: JSON.parse(JSON.stringify(editCoordinators)), updated_at: new Date().toISOString() })
        .eq("page_name", "contact")
        .eq("section_key", "coordinators");

      await supabase
        .from("page_content")
        .update({ content: JSON.parse(JSON.stringify(editGeneralInfo)), updated_at: new Date().toISOString() })
        .eq("page_name", "contact")
        .eq("section_key", "general_info");

      setCoordinators(editCoordinators);
      setGeneralInfo(editGeneralInfo);
      setEditing(false);
      toast.success("Content saved successfully");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditCoordinators(coordinators);
    setEditGeneralInfo(generalInfo);
    setEditing(false);
  };

  const updateCoordinator = (index: number, field: keyof Coordinator, value: string) => {
    const updated = [...editCoordinators];
    updated[index] = { ...updated[index], [field]: value };
    setEditCoordinators(updated);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const displayCoordinators = editing ? editCoordinators : coordinators;
  const displayInfo = editing ? editGeneralInfo : generalInfo;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Contact Us
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Have questions? Reach out to our organizing team for assistance.
          </p>
          {isAdmin && (
            <div className="mt-6 flex justify-center gap-2">
              {editing ? (
                <>
                  <Button onClick={handleSave} disabled={saving} variant="heroOutline">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button onClick={handleCancel} variant="ghost" className="text-primary-foreground">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} variant="heroOutline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Content
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Coordinators Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-poppins font-bold text-foreground">
              Organizing Team
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {displayCoordinators.map((coordinator, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-2">
                        <Input
                          value={coordinator.role}
                          onChange={(e) => updateCoordinator(index, "role", e.target.value)}
                          placeholder="Role"
                          className="text-sm"
                        />
                        <Input
                          value={coordinator.name}
                          onChange={(e) => updateCoordinator(index, "name", e.target.value)}
                          placeholder="Name"
                        />
                        <Input
                          value={coordinator.email}
                          onChange={(e) => updateCoordinator(index, "email", e.target.value)}
                          placeholder="Email"
                          type="email"
                        />
                        <Input
                          value={coordinator.phone}
                          onChange={(e) => updateCoordinator(index, "phone", e.target.value)}
                          placeholder="Phone"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="text-secondary text-sm font-medium">
                          {coordinator.role}
                        </span>
                        <h3 className="font-poppins font-semibold text-lg text-foreground mt-1">
                          {coordinator.name}
                        </h3>
                        <div className="mt-3 space-y-2">
                          <a
                            href={`mailto:${coordinator.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            {coordinator.email}
                          </a>
                          <a
                            href={`tel:${coordinator.phone}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            {coordinator.phone}
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* General Contact */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl shadow-card p-8 lg:p-12">
              <h2 className="text-2xl font-poppins font-bold text-foreground text-center mb-8">
                General Enquiries
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Email</h4>
                    {editing ? (
                      <Input
                        value={editGeneralInfo.email}
                        onChange={(e) => setEditGeneralInfo({ ...editGeneralInfo, email: e.target.value })}
                        type="email"
                      />
                    ) : (
                      <a
                        href={`mailto:${displayInfo.email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {displayInfo.email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Helpline</h4>
                    {editing ? (
                      <Input
                        value={editGeneralInfo.phone}
                        onChange={(e) => setEditGeneralInfo({ ...editGeneralInfo, phone: e.target.value })}
                      />
                    ) : (
                      <a
                        href={`tel:${displayInfo.phone}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {displayInfo.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Address</h4>
                    {editing ? (
                      <Textarea
                        value={editGeneralInfo.address}
                        onChange={(e) => setEditGeneralInfo({ ...editGeneralInfo, address: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">
                        {displayInfo.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
