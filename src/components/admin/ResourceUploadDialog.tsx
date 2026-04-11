import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  section_key: string;
}

interface ResourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
  onSuccess: () => void;
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceUploadDialogProps) {
  const isEditMode = Boolean(resource);
  const [title, setTitle] = useState(resource?.title || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(resource?.title || "");
      setDescription(resource?.description || "");
      setFile(null);
    }
  }, [open, resource]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generateSectionKey = (text: string) => {
    const slug = text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return slug || `resource_${Date.now()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title for the resource.");
      return;
    }

    setUploading(true);

    try {
      let fileUrl = resource?.file_url || null;
      let fileType = resource?.file_type || null;

      if (file) {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageKey = `${generateSectionKey(title)}_${Date.now()}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("resources")
          .upload(storageKey, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData, error: urlError } = supabase.storage
          .from("resources")
          .getPublicUrl(storageKey);

        if (urlError) throw urlError;

        fileUrl = urlData.publicUrl;
        fileType = file.name;
      }

      if (isEditMode && resource) {
        const { error: updateError } = await supabase
          .from("resources")
          .update({
            title,
            description,
            file_url: fileUrl,
            file_type: fileType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resource.id);

        if (updateError) throw updateError;
        toast.success("Resource updated successfully");
      } else {
        const sectionKey = generateSectionKey(title);
        const { error: insertError } = await supabase.from("resources").insert([
          {
            title,
            description,
            file_url: fileUrl,
            file_type: fileType,
            section_key: sectionKey,
            updated_at: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;
        toast.success("Resource added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving resource:", error);
      toast.error(error.message || "Failed to save resource");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Update Resource" : "Add Resource"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>File</Label>
            <div className="mt-2">
              {resource?.file_url && !file && (
                <p className="text-sm text-muted-foreground mb-2">
                  Current: {resource.file_type || "Uploaded"}
                </p>
              )}
              {file && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded">
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {file ? "Change File" : "Upload File"}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Saving..." : isEditMode ? "Save Changes" : "Create Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
