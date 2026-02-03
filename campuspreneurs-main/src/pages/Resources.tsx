import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { FileText, Download, HelpCircle, Calendar, BookOpen, FileSpreadsheet, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ResourceUploadDialog } from "@/components/admin/ResourceUploadDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { QuerySubmissionForm } from "@/components/resources/QuerySubmissionForm";
import { AdminQueryList } from "@/components/resources/AdminQueryList";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  ppt_template: FileText,
  evaluation_rubrics: FileSpreadsheet,
  rules_guidelines: BookOpen,
  timeline_pdf: Calendar,
};

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  section_key: string;
}

const faqs = [
  {
    question: "Who can participate in Campuspreneurs?",
    answer: "Any student currently enrolled in GCET across all departments can participate. Teams must have 3-5 members.",
  },
  {
    question: "Can we form cross-department teams?",
    answer: "Yes! Cross-functional teams from different departments are encouraged as they bring diverse perspectives.",
  },
  {
    question: "What is the registration fee?",
    answer: "Participation is free of cost. There are no registration fees for Campuspreneurs Chapter 1.",
  },
  {
    question: "Can we change our problem statement after registration?",
    answer: "Problem statement changes are allowed until Phase 1 deadline. Contact the organizers for assistance.",
  },
  {
    question: "What kind of prototypes are expected?",
    answer: "Prototypes can be hardware, software, or hybrid. The focus is on demonstrating your solution's feasibility.",
  },
  {
    question: "Will mentorship be provided?",
    answer: "Yes, registered teams get access to faculty mentors and industry experts throughout the event.",
  },
];

export default function Resources() {
  const { isAdmin } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("section_key");

    if (data) {
      setResources(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openEditDialog = (resource: Resource) => {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  };

  const handleDownload = (resource: Resource) => {
    if (resource.file_url) {
      window.open(resource.file_url, "_blank");
    }
  };

  const openDeleteDialog = (resource: Resource) => {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    try {
      // Delete file from storage if it exists
      if (selectedResource.file_url) {
        const fileName = selectedResource.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from("resources")
            .remove([fileName]);
        }
      }

      // Update resource record to remove file_url and file_type (keep the section but remove the file)
      const { error } = await supabase
        .from("resources")
        .update({
          file_url: null,
          file_type: null
        })
        .eq("id", selectedResource.id);

      if (error) throw error;

      toast.success("File deleted successfully");
      fetchResources();
      setDeleteDialogOpen(false);
      setSelectedResource(null);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error(error.message || "Failed to delete file");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Resources
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Download templates, guidelines, and everything you need for your submission.
          </p>
        </div>
      </section>

      {/* Downloads */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-poppins font-bold text-foreground">
              Downloads
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {resources.map((resource) => {
                const Icon = iconMap[resource.section_key] || FileText;
                return (
                  <div
                    key={resource.id}
                    className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all hover:-translate-y-1 flex flex-col"
                  >
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-foreground">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground text-sm flex-1">
                      {resource.description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full p-0"
                        size="sm"
                        onClick={() => handleDownload(resource)}
                        disabled={!resource.file_url}
                      >
                        <div className="flex items-center w-full px-3 py-2">
                          <Download className="w-4 h-4 flex-shrink-0" />
                          <span className="ml-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {resource.file_url ? `Download ${resource.file_type || "File"}` : "Not Available"}
                          </span>
                        </div>
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            className="w-full"
                            size="sm"
                            onClick={() => openEditDialog(resource)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Update File
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full"
                            size="sm"
                            onClick={() => openDeleteDialog(resource)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete File
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Admin Query Management */}
      {isAdmin && (
        <section className="py-16 lg:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <AdminQueryList />
          </div>
        </section>
      )}

      {/* User Query Submission */}
      {!isAdmin && (
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <QuerySubmissionForm />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-secondary font-medium text-sm uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="mt-3 text-2xl lg:text-3xl font-poppins font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Upload Dialog */}
      <ResourceUploadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        resource={selectedResource}
        onSuccess={fetchResources}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Resource"
        description={`Are you sure you want to delete "${selectedResource?.title}"? This will permanently remove the file and cannot be undone.`}
      />
    </Layout>
  );
}
